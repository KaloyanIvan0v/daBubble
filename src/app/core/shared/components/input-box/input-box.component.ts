import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnInit,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { first } from 'rxjs/operators';

import { Message } from 'src/app/core/shared/models/message.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { User } from 'src/app/core/shared/models/user.class';
import { MainService } from 'src/app/core/shared/services/main-service/main.service';
import { FirebaseServicesService } from '../../services/firebase/firebase.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserListComponent } from '../user-list/user-list.component';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule, EmojiPickerComponent, CommonModule, UserListComponent],
  templateUrl: './input-box.component.html',
  styleUrls: ['./input-box.component.scss'],
})
export class InputBoxComponent implements OnChanges, OnInit {
  @Input() messagePath = '';
  @Input() showEmojiPicker = false;
  @Input() receiverId: string | null = null;
  @Input() messageToEdit?: Message;
  @Input() usersUid: string[] = [];
  @Input() space = '';
  @Input() showMentionButton = true;

  @Output() mentionSelected = new EventEmitter<User>();

  filteredUserUids: string[] = [];
  channelName = signal<string>('');
  receiverName = signal<string>('');
  placeholder = signal<string>('Type your message here...');

  @ViewChild('messageTextarea')
  messageTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mirrorElement') mirrorElement!: ElementRef<HTMLDivElement>;

  userListPosition = { bottom: 0, left: 0 };
  inputData = new InputBoxData('', []);
  showUserList = false;
  showUserListTextArea = false;

  constructor(
    private mainService: MainService,
    private firebaseService: FirebaseServicesService
  ) {}

  ngOnInit(): void {
    this.setPlaceholder();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messageToEdit']) {
      this.updateInputDataMessage();
    }
    if (changes['messagePath'] || changes['receiverId']) {
      this.setPlaceholder();
    }
  }

  isChannel(): boolean {
    return this.messagePath.startsWith('/channels/');
  }

  private setPlaceholder(): void {
    const placeholders: { [key: string]: () => void } = {
      'new chat': () => this.placeholder.set('Start a new message'),
      directChat: () =>
        this.receiverId ? this.getReceiverName(this.receiverId) : null,
      channel: () =>
        this.extractChannelId() &&
        this.getChannelName(this.extractChannelId()!),
      thread: () => this.placeholder.set('Reply...'),
      default: () => this.placeholder.set('Type your message here...'),
    };
    (placeholders[this.space] || placeholders['default'])();
  }

  private getChannelName(channelId: string): void {
    this.firebaseService
      .getChannel(channelId)
      .pipe(first())
      .subscribe((channel) => {
        if (channel) this.placeholder.set(`Message to #${channel.name}`);
      });
  }

  private getReceiverName(receiverId: string): void {
    this.firebaseService
      .getUser(receiverId)
      .pipe(first())
      .subscribe((user) => {
        if (user) this.placeholder.set(`Message to ${user.name}`);
      });
  }

  private extractChannelId(): string | null {
    const parts = this.messagePath.split('/');
    return parts.length > 2 ? parts[2] : null;
  }

  private updateInputDataMessage(): void {
    this.inputData.message = this.messageToEdit?.value.text || '';
  }

  sendMessage(): void {
    if (this.hasMessage()) {
      this.isEditingMessage()
        ? this.updateEditedMessage()
        : this.sendNewMessage();
      this.resetInputData();
    }
  }

  private hasMessage(): boolean {
    return this.inputData.message.trim().length > 0;
  }

  private isEditingMessage(): boolean {
    return !!this.messageToEdit;
  }

  private updateEditedMessage(): void {
    if (this.messageToEdit) {
      this.messageToEdit.value.text = this.inputData.message;
      this.mainService.updateMessage(this.messageToEdit);
      this.messageToEdit = undefined;
    }
  }

  private sendNewMessage(): void {
    this.mainService.sendMessage(
      this.messagePath,
      this.inputData,
      this.receiverId
    );
  }

  private resetInputData(): void {
    this.inputData = new InputBoxData('', []);
  }

  onEmojiSelected(emoji: string): void {
    this.inputData.message += ` ${emoji}`;
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker(): void {
    this.showEmojiPicker = false;
  }

  showAvailableUsers(): void {
    this.showUserList = !this.showUserList;
  }

  closeUserList(): void {
    setTimeout(() => this.hideUserList(), 25);
  }

  private hideUserList(): void {
    this.showUserList = false;
    this.showUserListTextArea = false;
  }

  onMessageChange(): void {
    this.checkForMentionSign();
  }

  returnUser(user: User): void {
    this.mentionSelected.emit(user);
    this.addMentionedUser(user);
  }

  private addMentionedUser(user: User): void {
    const { message, cursorPos, lastAtIndex } = this.getMessageCursorData();
    this.inputData.message =
      lastAtIndex !== -1
        ? `${message.slice(0, lastAtIndex)}@${user.name} ${message.slice(
            cursorPos
          )}`
        : `${message} @${user.name} `;
    this.setCursorToEnd();
    this.closeUserList();
  }

  private setCursorToEnd(): void {
    const textarea = this.messageTextarea.nativeElement;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  async checkForMentionSign(): Promise<void> {
    const { message, cursorPos } = this.getCursorData();
    if (this.shouldHideUserList(cursorPos, message)) return;

    const lastAtIndex = message.lastIndexOf('@', cursorPos - 1);
    if (
      lastAtIndex === -1 ||
      this.hasTrailingSpace(message, lastAtIndex, cursorPos)
    ) {
      this.showUserListTextArea = false;
      return;
    }

    const mention = message.substring(lastAtIndex + 1, cursorPos).trim();
    if (mention && (await this.isMatchingUser(mention))) {
      await this.setFilteredUsers(mention);
      this.positionUserList(lastAtIndex);
    } else {
      this.showUserListTextArea = false;
    }
  }

  private shouldHideUserList(cursorPos: number, message: string): boolean {
    if (cursorPos === 0 || !message.trim()) {
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
    const substring = message.substring(lastAtIndex + 1, cursorPos).trimEnd();
    if (
      substring.length !== message.substring(lastAtIndex + 1, cursorPos).length
    ) {
      this.showUserListTextArea = false;
      return true;
    }
    return false;
  }

  private getCursorData(): { message: string; cursorPos: number } {
    const textarea = this.messageTextarea.nativeElement;
    return {
      message: this.inputData.message,
      cursorPos: textarea.selectionStart,
    };
  }

  private getMessageCursorData(): {
    message: string;
    cursorPos: number;
    lastAtIndex: number;
  } {
    const { message, cursorPos } = this.getCursorData();
    return {
      message,
      cursorPos,
      lastAtIndex: message.lastIndexOf('@', cursorPos - 1),
    };
  }

  private async setFilteredUsers(partialName: string): Promise<void> {
    const users = await this.fetchUsers(this.usersUid);
    this.filteredUserUids = this.extractUserUids(
      this.filterUsersByName(users, partialName)
    );
  }

  private async isMatchingUser(partialName: string): Promise<boolean> {
    if (!partialName) return false;
    const users = await this.fetchUsers(this.usersUid);
    return users.some((user) =>
      user?.name?.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  private async setFilteredUsersIfNeeded(mention: string): Promise<void> {
    if (mention) {
      await this.setFilteredUsers(mention);
      this.positionUserList(this.getMessageCursorData().lastAtIndex);
    }
  }

  private async fetchUsers(uids: string[]): Promise<User[]> {
    const userPromises = uids.map((uid) =>
      this.firebaseService.getUser(uid).pipe(first()).toPromise()
    );
    return Promise.all(userPromises) as Promise<User[]>;
  }

  private filterUsersByName(users: User[], partialName: string): User[] {
    const lower = partialName.toLowerCase();
    return users.filter((user) => user?.name?.toLowerCase().startsWith(lower));
  }

  private extractUserUids(users: User[]): string[] {
    return users.filter((user) => user?.uid).map((user) => user.uid);
  }

  private positionUserList(atIndex: number): void {
    const textarea = this.messageTextarea.nativeElement;
    const mirror = this.mirrorElement.nativeElement;
    mirror.textContent = textarea.value.substring(0, atIndex);
    const marker = document.createElement('span');
    marker.textContent = '@';
    marker.style.backgroundColor = 'yellow';
    mirror.appendChild(marker);
    const markerRect = marker.getBoundingClientRect();
    const containerRect = textarea.parentElement?.getBoundingClientRect();
    if (containerRect) {
      this.userListPosition = {
        bottom: markerRect.bottom - containerRect.bottom + 100,
        left: markerRect.left - containerRect.left,
      };
      this.showUserListTextArea = true;
    } else {
      console.error('Container rectangle is null or undefined');
    }
  }
}
