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
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Message } from 'src/app/core/shared/models/message.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { User } from 'src/app/core/shared/models/user.class';
import { MainService } from 'src/app/core/shared/services/main-service/main.service';
import { FirebaseServicesService } from '../../services/firebase/firebase.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserListComponent } from '../user-list/user-list.component';
import { InputBoxHelper } from './input-box.helper'; // Import der Helper-Klasse

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule, EmojiPickerComponent, CommonModule, UserListComponent],
  templateUrl: './input-box.component.html',
  styleUrls: ['./input-box.component.scss'],
})
export class InputBoxComponent implements OnChanges, OnInit, AfterViewInit {
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
  @ViewChild('inputField') inputElement!: ElementRef<HTMLInputElement>;

  userListPosition = { bottom: 0, left: 0 };
  inputData = new InputBoxData('', []);
  showUserList = false;
  showUserListTextArea = false;

  private helper: InputBoxHelper;

  constructor(
    private mainService: MainService,
    private firebaseService: FirebaseServicesService
  ) {
    this.helper = new InputBoxHelper(this.firebaseService, this.mainService);
  }

  ngOnInit(): void {
    this.initializePlaceholder();
  }

  ngAfterViewInit() {
    this.inputElement.nativeElement.focus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messageToEdit']) {
      this.updateInputDataMessage();
    }
    if (changes['messagePath'] || changes['receiverId'] || changes['space']) {
      this.initializePlaceholder();
      setTimeout(() => this.focusInput(), 200);
    }
    if (changes['usersUid'] && this.usersUid[0] !== undefined) {
      this.loadUsers(this.usersUid);
    }
  }

  focusInput(): void {
    this.inputElement.nativeElement.focus();
  }

  /**
   * Determines if the current message path is a channel.
   * @returns {boolean} - True if the message path starts with '/channels/', otherwise false.
   */
  isChannel(): boolean {
    return this.messagePath.startsWith('/channels/');
  }

  /**
   * Initializes the placeholder based on the current context.
   */
  private initializePlaceholder(): void {
    this.helper.initializePlaceholder(
      this.space,
      this.receiverId,
      this.messagePath,
      this.channelName,
      this.placeholder,
      this.firebaseService
    );
  }

  /**
   * Updates the input data when editing a message.
   */
  private updateInputDataMessage(): void {
    this.inputData.message = this.messageToEdit?.value.text || '';
  }

  /**
   * Sends a message, either creating a new one oder updating an existing one.
   */
  sendMessage(): void {
    if (this.hasMessage()) {
      this.isEditingMessage()
        ? this.updateEditedMessage()
        : this.sendNewMessage();
      this.resetInputData();
    }
  }

  /**
   * Checks if there is a message to send.
   * @returns {boolean} - True if the message is not empty, otherwise false.
   */
  private hasMessage(): boolean {
    return this.inputData.message.trim().length > 0;
  }

  /**
   * Determines if the current operation is editing an existing message.
   * @returns {boolean} - True if editing, otherwise false.
   */
  private isEditingMessage(): boolean {
    return !!this.messageToEdit;
  }

  /**
   * Updates an existing message with new content.
   */
  private updateEditedMessage(): void {
    this.helper.updateEditedMessage(
      this.mainService,
      this.messageToEdit,
      this.inputData
    );
    this.messageToEdit = undefined;
  }

  /**
   * Sends a new message to the specified path and receiver.
   */
  private sendNewMessage(): void {
    this.helper.sendNewMessage(
      this.mainService,
      this.messagePath,
      this.inputData,
      this.receiverId
    );
  }

  /**
   * Resets the input data after sending a message.
   */
  private resetInputData(): void {
    this.inputData = new InputBoxData('', []);
  }

  /**
   * Appends an emoji to the current message.
   * @param {string} emoji - The emoji to append.
   */
  onEmojiSelected(emoji: string): void {
    this.inputData.message += ` ${emoji}`;
  }

  /**
   * Toggles the visibility of the emoji picker.
   */
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Closes the emoji picker.
   */
  closeEmojiPicker(): void {
    this.showEmojiPicker = false;
  }

  /**
   * Toggles the visibility of the user list.
   */
  showAvailableUsers(): void {
    this.showUserList = !this.showUserList;
  }

  /**
   * Closes the user list with a slight delay.
   */
  closeUserList(): void {
    setTimeout(() => this.hideUserList(), 25);
  }

  /**
   * Hides the user list und associated textarea.
   */
  private hideUserList(): void {
    this.showUserList = false;
    this.showUserListTextArea = false;
  }

  /**
   * Handles changes in the message textarea.
   */
  onMessageChange(): void {
    this.checkForMentionSign();
  }

  /**
   * Emits the selected user und adds them as a mention in the message.
   * @param {User} user - The user to mention.
   */
  returnUser(user: User): void {
    this.mentionSelected.emit(user);
    this.addMentionedUser(user);
  }

  /**
   * Adds a mentioned user to the message at the cursor position.
   * @param {User} user - The user to mention.
   */
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

  /**
   * Sets the cursor position to the end of the textarea.
   */
  private setCursorToEnd(): void {
    const textarea = this.messageTextarea.nativeElement;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  /**
   * Checks for the presence of a mention sign und processes it.
   */
  async checkForMentionSign(): Promise<void> {
    const { message, cursorPos } = this.getCursorData();
    if (this.shouldHideUserList(cursorPos, message)) return;

    const lastAtIndex = message.lastIndexOf('@', cursorPos - 1);
    if (this.isInvalidMention(message, lastAtIndex, cursorPos)) return;

    const mention = message.substring(lastAtIndex + 1, cursorPos).trim();
    if (mention && (await this.helper.isMatchingUser(mention))) {
      await this.helper.setFilteredUsers(mention, this.usersUid);
      this.positionUserList(lastAtIndex);
    } else {
      this.showUserListTextArea = false;
    }
  }

  /**
   * Determines if the user list should be hidden based on the cursor position und message content.
   * @param {number} cursorPos - The current cursor position.
   * @param {string} message - The current message content.
   * @returns {boolean} - True if the user list should be hidden, otherwise false.
   */
  private shouldHideUserList(cursorPos: number, message: string): boolean {
    if (cursorPos === 0 || !message.trim()) {
      this.showUserListTextArea = false;
      return true;
    }
    return false;
  }

  /**
   * Determines if the mention is invalid based on trailing spaces.
   * @param {string} message - The current message content.
   * @param {number} lastAtIndex - The index of the last '@' character.
   * @param {number} cursorPos - The current cursor position.
   * @returns {boolean} - True if the mention is invalid, otherwise false.
   */
  private isInvalidMention(
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

  /**
   * Retrieves the current message und cursor position.
   * @returns {{ message: string; cursorPos: number }} - The message und cursor position.
   */
  private getCursorData(): { message: string; cursorPos: number } {
    const textarea = this.messageTextarea.nativeElement;
    return {
      message: this.inputData.message,
      cursorPos: textarea.selectionStart,
    };
  }

  /**
   * Retrieves the current message, cursor position, und the index of the last '@' character.
   * @returns {{ message: string; cursorPos: number; lastAtIndex: number }} - The message data.
   */
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

  /**
   * Positions the user list dropdown based on the cursor position.
   * @param {number} atIndex - The index at which to position the user list.
   */
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
      this.helper.handleError('Container rectangle is null or undefined', null);
    }
  }

  /**
   * Loads users based on provided UIDs.
   * @param {string[]} uids - An array of user UIDs.
   */
  private async loadUsers(uids: string[]): Promise<void> {
    try {
      const users = await this.helper.fetchUsers(this.firebaseService, uids);
      const filteredUsers = this.helper.filterUsersByName(users, '');
      this.filteredUserUids = this.helper.extractUserUids(filteredUsers);
    } catch (error) {
      this.helper.handleError('Error loading users:', error);
    }
  }
}
