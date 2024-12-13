import { Message } from 'src/app/core/shared/models/message.class';
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
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { FormsModule } from '@angular/forms';
import { MainService } from 'src/app/core/shared/services/main-service/main.service';
import { FirebaseServicesService } from '../../services/firebase/firebase.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserListComponent } from '../user-list/user-list.component';
import { User } from 'src/app/core/shared/models/user.class';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule, EmojiPickerComponent, CommonModule, UserListComponent],
  templateUrl: './input-box.component.html',
  styleUrls: ['./input-box.component.scss'],
})
export class InputBoxComponent implements OnChanges, OnInit {
  @Input() messagePath: string = '';
  @Input() showEmojiPicker: boolean = false;
  @Input() receiverId: string | null = null;
  @Input() messageToEdit: Message | undefined = undefined;
  @Input() usersUid: string[] = [];
  @Input() space: string = '';
  @Input() showMentionButton: boolean = true;
  filteredUserUids: string[] = [];
  channelName = signal<string>('');
  receiverName = signal<string>('');
  public placeholder = signal<string>('Default Placeholder');

  @ViewChild('messageTextarea')
  messageTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mirrorElement') mirrorElement!: ElementRef<HTMLDivElement>;

  userListBottom = 0;
  userListLeft = 0;

  inputData = new InputBoxData('', []);
  selectedUser: User | null = null;
  showUserList: boolean = false;
  showUserListTextArea: boolean = false;

  constructor(
    private mainService: MainService,
    private firebaseService: FirebaseServicesService
  ) {}

  ngOnInit() {
    this.setPlaceholder();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messageToEdit']) {
      this.inputData.message = this.messageToEdit
        ? this.messageToEdit.value.text
        : '';
    }
    if (changes['messagePath'] || changes['receiverId']) {
      this.setPlaceholder();
    }
  }

  isChannel() {
    if (this.messagePath !== '') {
      return this.messagePath.split('/')[1] === 'channels';
    } else {
      return false;
    }
  }

  getChannelName(channelId: string): void {
    this.firebaseService
      .getChannel(channelId)
      .pipe(first((channel) => channel !== null))
      .subscribe((channel) => {
        this.configChannelPlaceholder(channel.name);
      });
  }

  getReceiverName(receiverId: string): void {
    this.firebaseService
      .getUser(receiverId)
      .pipe(first((user) => user !== null))
      .subscribe((user) => {
        this.configDirectChatPlaceholder(user.name);
      });
  }

  setPlaceholder() {
    if (this.space === 'new chat') {
      this.placeholder.set('Starte eine neue Nachricht');
    } else if (this.space === 'directChat') {
      this.getReceiverName(this.receiverId!);
    } else if (this.space === 'channel') {
      const channelId = this.messagePath.split('/')[2];
      this.getChannelName(channelId);
    } else if (this.space === 'thread') {
      this.placeholder.set('Antworten...');
    }
  }

  configChannelPlaceholder(channelName: string) {
    this.placeholder.set('Nachricht an #' + channelName);
  }

  configDirectChatPlaceholder(receiverName: string) {
    this.placeholder.set('Nachricht an ' + receiverName);
  }

  sendMessage() {
    if (this.inputData.message.length !== 0) {
      if (this.messageToEdit !== undefined) {
        this.updateEditedMessage();
      } else {
        this.sendNewMessage();
      }
    } else {
    }
    this.resetInputData();
  }

  onEmojiSelected(emoji: string) {
    this.inputData.message += ' ' + emoji;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  showAvailableUsers() {
    this.showUserList = !this.showUserList;
  }

  closeUserList() {
    setTimeout(() => {
      this.showUserList = false;
      this.showUserListTextArea = false;
    }, 25);
  }

  onMessageChange() {
    this.checkForMentionSign();
  }

  returnUser(user: User) {
    this.addMentionedUser(user);
  }

  addMentionedUser(user: User) {
    const textarea = this.messageTextarea.nativeElement;
    const message = this.inputData.message;
    const cursorPos = textarea.selectionStart;
    const lastAtIndex = message.lastIndexOf('@', cursorPos - 1);

    if (lastAtIndex !== -1) {
      this.replaceMentionedUser(message, user, cursorPos, lastAtIndex);
    } else {
      this.appendMentionedUser(user);
    }
    this.setCursorToEnd();
    this.closeUserList();
  }

  setCursorToEnd() {
    const textarea = document.querySelector('textarea');
    textarea?.focus();
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  async checkForMentionSign() {
    const { textarea, message, cursorPos } = this.getCursorData();
    if (this.shouldHideUserList(cursorPos, message)) return;

    const lastAtIndex = this.getLastAtIndex(message, cursorPos);
    if (this.invalidAtIndex(lastAtIndex)) return;

    if (this.hasTrailingSpace(message, lastAtIndex, cursorPos)) return;

    await this.handleValidMention(message, lastAtIndex, cursorPos);
  }

  async setFilteredUsers(partialName: string) {
    const users = await this.getUsersFromUids(this.usersUid);
    const filteredUsers = this.filterUsers(users, partialName);

    // Nur Nutzer verwenden, die nicht null sind
    const nonNullUsers = filteredUsers.filter(
      (user) => user !== null && user !== undefined
    );
    this.filteredUserUids = nonNullUsers.map((user) => user.uid);
  }

  async isMatchingUser(partialName: string): Promise<boolean> {
    if (!partialName) return false;
    const users = await this.getUsersFromUids(this.usersUid);
    return users.some(
      (user) =>
        user?.name?.toLowerCase().startsWith(partialName.toLowerCase()) ?? false
    );
  }

  private async getUsersFromUids(uids: string[]): Promise<User[]> {
    const users: User[] = [];
    for (const uid of uids) {
      const user = (await this.firebaseService
        .getUser(uid)
        .pipe(first())
        .toPromise()) as User;
      users.push(user);
    }
    return users;
  }

  positionUserList(atIndex: number) {
    const textarea = this.messageTextarea.nativeElement;
    const mirror = this.mirrorElement.nativeElement;
    mirror.textContent = textarea.value.substring(0, atIndex);

    const marker = this.createMarker();
    mirror.appendChild(marker);

    const containerRect = textarea.parentElement?.getBoundingClientRect();
    if (containerRect) {
      this.calculateUserListPosition(marker, containerRect);
      this.showUserListTextArea = true;
    } else {
      console.error('containerRect is null or undefined');
    }
  }

  //------------------ Private Helper Methods ------------------//

  private updateEditedMessage() {
    if (this.messageToEdit) {
      this.messageToEdit.value.text = this.inputData.message;
      this.mainService.updateMessage(this.messageToEdit);
      this.messageToEdit = undefined;
    }
  }

  private sendNewMessage() {
    this.mainService.sendMessage(
      this.messagePath,
      this.inputData,
      this.receiverId
    );
  }

  private resetInputData() {
    this.inputData = new InputBoxData('', []);
  }

  private replaceMentionedUser(
    message: string,
    user: User,
    cursorPos: number,
    lastAtIndex: number
  ) {
    this.inputData.message =
      message.slice(0, lastAtIndex) +
      '@' +
      user.name +
      ' ' +
      message.slice(cursorPos);
  }

  private appendMentionedUser(user: User) {
    this.inputData.message += ` @${user.name} `;
  }

  private getCursorData() {
    const textarea = this.messageTextarea.nativeElement;
    return {
      textarea,
      message: this.inputData.message,
      cursorPos: textarea.selectionStart,
    };
  }

  private getLastAtIndex(message: string, cursorPos: number): number {
    return message.lastIndexOf('@', cursorPos - 1);
  }

  private invalidAtIndex(lastAtIndex: number): boolean {
    if (lastAtIndex === -1) {
      this.showUserListTextArea = false;
      return true;
    }
    return false;
  }

  private hasTrailingSpace(
    message: string,
    lastAtIndex: number,
    cursorPos: number
  ): boolean {
    if (this.containsTrailingSpace(message, lastAtIndex, cursorPos)) {
      this.showUserListTextArea = false;
      return true;
    }
    return false;
  }

  private async handleValidMention(
    message: string,
    lastAtIndex: number,
    cursorPos: number
  ) {
    const mentionSubstring = this.getMentionSubstring(
      message,
      lastAtIndex,
      cursorPos
    );
    if (await this.shouldShowUserListTextArea(mentionSubstring)) {
      await this.handleUserListDisplay(mentionSubstring, lastAtIndex);
    } else {
      this.showUserListTextArea = false;
    }
  }

  private async handleUserListDisplay(
    mentionSubstring: string,
    lastAtIndex: number
  ) {
    await this.setFilteredUsers(mentionSubstring);
    this.positionUserList(lastAtIndex);
  }

  private containsTrailingSpace(
    message: string,
    lastAtIndex: number,
    cursorPos: number
  ): boolean {
    const rawMentionSubstring = message.substring(lastAtIndex + 1, cursorPos);
    return rawMentionSubstring.length !== rawMentionSubstring.trimEnd().length;
  }

  private getMentionSubstring(
    message: string,
    lastAtIndex: number,
    cursorPos: number
  ) {
    return message.substring(lastAtIndex + 1, cursorPos).trim();
  }

  private async shouldShowUserListTextArea(
    mentionSubstring: string
  ): Promise<boolean> {
    if (mentionSubstring === '') return true;
    return await this.isMatchingUser(mentionSubstring);
  }

  private filterUsers(users: User[], partialName: string): User[] {
    if (!partialName) return users;
    return users.filter((user) =>
      user?.name?.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  private createMarker(): HTMLSpanElement {
    const marker = document.createElement('span');
    marker.textContent = '@';
    marker.style.backgroundColor = 'yellow'; // Testvisualisierung
    return marker;
  }

  private calculateUserListPosition(
    marker: HTMLSpanElement,
    containerRect: DOMRect
  ) {
    const markerRect = marker.getBoundingClientRect();
    this.userListBottom = markerRect.bottom - containerRect.bottom + 100;
    this.userListLeft = markerRect.left - containerRect.left;
  }

  private shouldHideUserList(cursorPos: number, message: string): boolean {
    if (cursorPos === 0 || !message) {
      this.showUserListTextArea = false;
      return true;
    }
    return false;
  }
}
