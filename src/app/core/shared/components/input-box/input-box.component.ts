import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { first } from 'rxjs/operators';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from 'src/app/core/shared/models/user.class';
import { MainService } from 'src/app/core/shared/services/main-service/main.service';
import { FirebaseServicesService } from '../../services/firebase/firebase.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserListComponent } from '../user-list/user-list.component';
import { MentionUserService } from 'src/app/core/shared/services/mention-user-serivice/mention-user.service';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule, EmojiPickerComponent, CommonModule, UserListComponent],
  templateUrl: './input-box.component.html',
  styleUrls: ['./input-box.component.scss'],
})
export class InputBoxComponent implements OnChanges, OnInit {
  @Input() messagePath: string = '';
  @Input() showEmojiPicker = false;
  @Input() receiverId: string | null = null;
  @Input() messageToEdit: Message | undefined;
  @Input() usersUid: string[] = [];
  @Input() space: string = '';
  @Input() showMentionButton = true;

  filteredUserUids: string[] = [];
  showUserList = false;
  showUserListTextArea = false;
  userListBottom = 0;
  userListLeft = 0;
  channelName = signal<string>('');
  receiverName = signal<string>('');
  public placeholder = signal<string>('Default Placeholder');
  inputData = new InputBoxData('', []);
  selectedUser: User | null = null;

  @ViewChild('messageTextarea')
  messageTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mirrorElement') mirrorElement!: ElementRef<HTMLDivElement>;

  constructor(
    private mainService: MainService,
    private firebaseService: FirebaseServicesService,
    private mentionUserService: MentionUserService
  ) {}

  /** Initializes placeholder on component creation. */
  ngOnInit() {
    this.setPlaceholder();
  }

  /**
   * Reacts to @Input changes, updates message text if editing, resets placeholder if path changes.
   * @param changes SimpleChanges
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['messageToEdit']) {
      this.inputData.message = this.messageToEdit
        ? this.messageToEdit.value.text
        : '';
    }
    if (changes['messagePath'] || changes['receiverId']) this.setPlaceholder();
  }

  /** Returns true if the path is a channel. */
  isChannel(): boolean {
    if (!this.messagePath) return false;
    return this.messagePath.split('/')[1] === 'channels';
  }

  /**
   * Retrieves channel data from Firebase and sets placeholder with channel name.
   * @param channelId string
   */
  getChannelName(channelId: string): void {
    this.firebaseService
      .getChannel(channelId)
      .pipe(first((c) => c !== null))
      .subscribe((c) => this.configChannelPlaceholder(c.name));
  }

  /**
   * Retrieves user data from Firebase and sets placeholder with user name.
   * @param rid string
   */
  getReceiverName(rid: string): void {
    this.firebaseService
      .getUser(rid)
      .pipe(first((u) => u !== null))
      .subscribe((u) => this.configDirectChatPlaceholder(u.name));
  }

  /** Sets placeholder text based on current 'space'. */
  setPlaceholder(): void {
    if (this.space === 'new chat')
      this.placeholder.set('Starte eine neue Nachricht');
    else if (this.space === 'directChat' && this.receiverId)
      this.getReceiverName(this.receiverId);
    else if (this.space === 'channel') {
      const id = this.messagePath.split('/')[2];
      this.getChannelName(id);
    } else if (this.space === 'thread') this.placeholder.set('Antworten...');
  }

  /**
   * Configures the placeholder for a channel.
   * @param cn string
   */
  configChannelPlaceholder(cn: string): void {
    this.placeholder.set('Nachricht an #' + cn);
  }

  /**
   * Configures the placeholder for a direct chat.
   * @param rn string
   */
  configDirectChatPlaceholder(rn: string): void {
    this.placeholder.set('Nachricht an ' + rn);
  }

  /** Sends a message (edited or new) and resets input. */
  sendMessage(): void {
    if (this.inputData.message.length > 0) {
      if (this.messageToEdit) this.updateEditedMessage();
      else this.sendNewMessage();
    }
    this.resetInputData();
  }

  /** Updates the text of an existing message. */
  private updateEditedMessage(): void {
    if (this.messageToEdit) {
      this.messageToEdit.value.text = this.inputData.message;
      this.mainService.updateMessage(this.messageToEdit);
      this.messageToEdit = undefined;
    }
  }

  /** Sends a new message via the main service. */
  private sendNewMessage(): void {
    this.mainService.sendMessage(
      this.messagePath,
      this.inputData,
      this.receiverId
    );
  }

  /** Resets input data. */
  private resetInputData(): void {
    this.inputData = new InputBoxData('', []);
  }

  /**
   * Adds an emoji to the message text.
   * @param emoji string
   */
  onEmojiSelected(emoji: string): void {
    this.inputData.message += ' ' + emoji;
  }

  /** Toggles the emoji picker UI. */
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /** Closes the emoji picker. */
  closeEmojiPicker(): void {
    this.showEmojiPicker = false;
  }

  /** Toggles the user list visibility. */
  showAvailableUsers(): void {
    this.showUserList = !this.showUserList;
  }

  /** Closes the user list popover. */
  closeUserList(): void {
    setTimeout(() => {
      this.showUserList = false;
      this.showUserListTextArea = false;
    }, 25);
  }

  /** Called on textarea change: checks if mention feature should activate. */
  onMessageChange(): void {
    this.checkForMentionSign();
  }

  /**
   * Checks for '@' mention triggers, decides whether to show user list.
   */
  async checkForMentionSign(): Promise<void> {
    const { message, cursorPos } = this.getMessageAndCursorPos();
    if (this.mentionUserService.shouldHideUserList(cursorPos, message))
      return this.hideList();
    await this.handleMentionFlow(message, cursorPos);
  }

  /**
   * Continues the mention flow by analyzing indices/spaces, calls user list if valid.
   * @param message string
   * @param cursorPos number
   */
  private async handleMentionFlow(
    message: string,
    cursorPos: number
  ): Promise<void> {
    const i = this.mentionUserService.getLastAtIndex(message, cursorPos);
    if (this.shouldHideListByIndex(i, message, cursorPos))
      return this.hideList();
    if (!(await this.canShowUserList(message, i, cursorPos)))
      return this.hideList();
    const sub = this.mentionUserService.getMentionSubstring(
      message,
      i,
      cursorPos
    );
    await this.setFilteredUsers(sub);
    this.positionUserList(i);
  }

  /**
   * Returns message text and cursor pos from textarea.
   * @returns { message, cursorPos }
   */
  private getMessageAndCursorPos(): { message: string; cursorPos: number } {
    const area = this.messageTextarea.nativeElement;
    return { message: this.inputData.message, cursorPos: area.selectionStart };
  }

  /**
   * Checks if user list should be hidden based on @-index or trailing space logic.
   * @param i number
   * @param m string
   * @param c number
   */
  private shouldHideListByIndex(i: number, m: string, c: number): boolean {
    if (this.mentionUserService.invalidAtIndex(i)) return true;
    return this.mentionUserService.containsTrailingSpace(m, i, c);
  }

  /**
   * Determines if partial mention can match any user in DB.
   * @param m string
   * @param i number
   * @param c number
   */
  private async canShowUserList(
    m: string,
    i: number,
    c: number
  ): Promise<boolean> {
    const sub = this.mentionUserService.getMentionSubstring(m, i, c);
    if (sub === '') return true;
    return this.mentionUserService.isMatchingUser(
      sub,
      this.firebaseService,
      this.usersUid
    );
  }

  /** Hides the mention user list. */
  private hideList(): void {
    this.showUserListTextArea = false;
  }

  /**
   * Retrieves users from DB, filters by partial mention name, updates filteredUserUids.
   * @param partialName string
   */
  async setFilteredUsers(partialName: string): Promise<void> {
    const all = await this.mentionUserService.getUsersFromUids(
      this.usersUid,
      this.firebaseService
    );
    const filtered = this.mentionUserService
      .filterUsers(all, partialName)
      .filter((u) => !!u);
    this.filteredUserUids = filtered.map((u) => u.uid);
  }

  /**
   * Positions the user list next to the mention marker.
   * @param atIndex number
   */
  positionUserList(atIndex: number): void {
    const mark = this.prepareMirrorContent(atIndex);
    const rect = this.getContainerRect();
    if (!rect) return console.error('containerRect is null or undefined');
    const { bottom, left } = this.mentionUserService.calculateUserListPosition(
      mark,
      rect
    );
    this.userListBottom = bottom;
    this.userListLeft = left;
    this.showUserListTextArea = true;
  }

  /**
   * Updates the mirror content to show text up to '@' index and returns a new marker.
   * @param idx number
   */
  private prepareMirrorContent(idx: number): HTMLSpanElement {
    const txt = this.messageTextarea.nativeElement;
    const mir = this.mirrorElement.nativeElement;
    mir.textContent = txt.value.substring(0, idx);
    const marker = this.mentionUserService.createMarker();
    mir.appendChild(marker);
    return marker;
  }

  /** Gets bounding rect of parent container for positioning. */
  private getContainerRect(): DOMRect | undefined {
    return this.messageTextarea.nativeElement.parentElement?.getBoundingClientRect();
  }

  /** Called when a user is selected from the mention list. */
  returnUser(u: User): void {
    this.addMentionedUser(u);
  }

  /**
   * Inserts a mention into the current message (replace or append).
   * @param user User
   */
  addMentionedUser(user: User): void {
    const { message, cursorPos, lastAtIndex } = this.getMentionPositions();
    if (lastAtIndex !== -1)
      this.replaceMentionedUser(message, user, cursorPos, lastAtIndex);
    else this.appendMentionedUser(user);
    this.finishAddMention();
  }

  /** Gets message, cursor position, and last '@' index. */
  private getMentionPositions(): {
    message: string;
    cursorPos: number;
    lastAtIndex: number;
  } {
    const area = this.messageTextarea.nativeElement;
    const msg = this.inputData.message;
    return {
      message: msg,
      cursorPos: area.selectionStart,
      lastAtIndex: msg.lastIndexOf('@', area.selectionStart - 1),
    };
  }

  /** Sets cursor to end and closes user list. */
  private finishAddMention(): void {
    this.setCursorToEnd();
    this.closeUserList();
  }

  /**
   * Replaces text after '@' with the selected user's name.
   * @param msg string
   * @param user User
   * @param pos number
   * @param idx number
   */
  private replaceMentionedUser(
    msg: string,
    user: User,
    pos: number,
    idx: number
  ): void {
    this.inputData.message =
      msg.slice(0, idx) + '@' + user.name + ' ' + msg.slice(pos);
  }

  /**
   * Appends a mention at the end of the message.
   * @param user User
   */
  private appendMentionedUser(user: User): void {
    this.inputData.message += ` @${user.name} `;
  }

  /** Sets focus and cursor at the end of the textarea. */
  setCursorToEnd(): void {
    const ta = document.querySelector('textarea');
    ta?.focus();
    if (ta) ta.setSelectionRange(ta.value.length, ta.value.length);
  }
}
