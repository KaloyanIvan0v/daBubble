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
import { Channel } from 'src/app/core/shared/models/channel.class';
import { ChannelListComponent } from 'src/app/core/components/main/left-side-component/channel-list/channel-list.component';
import { ChannelsListComponent } from '../channels-list/channels-list.component';
import { MentionService } from '../../services/mention-service/mention.service';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [
    FormsModule,
    EmojiPickerComponent,
    CommonModule,
    UserListComponent,
    ChannelListComponent,
    ChannelsListComponent,
  ],
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
  filteredChannelUids: string[] = [];
  public placeholder = signal<string>('Default Placeholder');

  @ViewChild('messageTextarea')
  messageTextarea!: ElementRef<HTMLTextAreaElement>;

  @ViewChild('mirrorElement')
  mirrorElement!: ElementRef<HTMLDivElement>;

  userListBottom = 0;
  userListLeft = 0;
  channelListBottom = 0;
  channelListLeft = 0;

  inputData = new InputBoxData('', []);
  selectedUser: User | null = null;
  showUserList: boolean = false;
  showUserListTextArea: boolean = false;
  showChannelListTextArea: boolean = false;

  /**
   * Creates an instance of InputBoxComponent.
   * @param mainService - The MainService for sending/updating messages
   * @param firebaseService - The Firebase service for database interaction
   * @param mentionService - The service handling mention logic
   */
  constructor(
    private mainService: MainService,
    private firebaseService: FirebaseServicesService,
    private mentionService: MentionService
  ) {}

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   * Loads placeholders and fetches channels if needed.
   */
  ngOnInit() {
    this.setPlaceholder();
    this.mentionService.loadAllChannels();
  }

  /**
   * Lifecycle hook that is called when any data-bound property changes.
   * @param changes - The set of changed properties
   */
  ngOnChanges(changes: SimpleChanges) {
    this.handleChangeMessageToEdit(changes);
    this.handleChangePathOrReceiver(changes);
  }

  /**
   * Checks whether the current path refers to a channel.
   * @returns True if the path is a channel path, otherwise false.
   */
  isChannel(): boolean {
    if (!this.messagePath) return false;
    return this.messagePath.split('/')[1] === 'channels';
  }

  /**
   * Retrieves channel information and updates the placeholder accordingly.
   * @param channelId - The ID of the channel
   */
  getChannelName(channelId: string): void {
    this.firebaseService
      .getChannel(channelId)
      .pipe(first((channel) => channel !== null))
      .subscribe((channel) => this.configChannelPlaceholder(channel.name));
  }

  /**
   * Retrieves user information and updates the placeholder for direct chat.
   * @param receiverId - The ID of the user
   */
  getReceiverName(receiverId: string): void {
    this.firebaseService
      .getUser(receiverId)
      .pipe(first((user) => user !== null))
      .subscribe((user) => this.configDirectChatPlaceholder(user.name));
  }

  /**
   * Sets the appropriate placeholder based on the current space.
   */
  setPlaceholder() {
    if (this.space === 'new chat') this.setPlaceholderNewChat();
    else if (this.space === 'directChat') this.setPlaceholderDirectChat();
    else if (this.space === 'channel') this.setPlaceholderChannel();
    else if (this.space === 'thread') this.placeholder.set('Antworten...');
  }

  /**
   * Updates the placeholder text for channels.
   * @param channelName - The name of the channel
   */
  configChannelPlaceholder(channelName: string) {
    this.placeholder.set('Nachricht an #' + channelName);
  }

  /**
   * Updates the placeholder text for direct chat.
   * @param receiverName - The name of the receiver
   */
  configDirectChatPlaceholder(receiverName: string) {
    this.placeholder.set('Nachricht an ' + receiverName);
  }

  /**
   * Checks if there is message content and either updates or sends a message.
   */
  sendMessage() {
    if (!this.hasMessageContent()) return;
    this.editingExistingMessage()
      ? this.updateEditedMessage()
      : this.sendNewMessage();
    this.resetInputData();
  }

  /**
   * Appends the selected emoji to the input text.
   * @param emoji - The selected emoji character
   */
  onEmojiSelected(emoji: string) {
    this.inputData.message += ' ' + emoji;
  }

  /**
   * Toggles the visibility of the emoji picker.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Closes the emoji picker.
   */
  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  /**
   * Toggles the visibility of the user list popover.
   */
  showAvailableUsers() {
    this.showUserList = !this.showUserList;
  }

  /**
   * Closes the user list popover after a short delay (to allow click events).
   */
  closeUserList() {
    setTimeout(() => {
      this.showUserList = false;
      this.showUserListTextArea = false;
    }, 25);
  }

  /**
   * Is triggered on input/keyup/click in the textarea.
   * Splits mention logic into user mention and channel mention checks.
   */
  onMessageChange() {
    this.handleUserMention();
    this.handleChannelMention();
  }

  /**
   * Inserts a selected user mention into the current message and closes the list.
   * @param user - The selected user
   */
  returnUser(user: User) {
    this.mentionService.addMentionedUser(
      this.inputData,
      user,
      this.messageTextarea
    );
    this.setCursorToEnd();
    this.closeUserList();
  }

  /**
   * Inserts a selected channel mention into the current message.
   * @param selectedChannelId - The ID of the selected channel
   */
  returnChannel(selectedChannelId: string) {
    this.mentionService.addMentionedChannel(
      this.inputData,
      selectedChannelId,
      this.messageTextarea
    );
    this.setCursorToEnd();
    this.showChannelListTextArea = false;
  }

  /**
   * Checks and updates user-mention related states.
   * Called from onMessageChange().
   */
  private handleUserMention() {
    this.mentionService.checkForMentionSign(
      this.inputData,
      this.messageTextarea,
      this.mirrorElement,
      this.usersUid,
      (val) => (this.showUserListTextArea = val),
      (uids) => (this.filteredUserUids = uids),
      (bottom, left) => {
        this.userListBottom = bottom;
        this.userListLeft = left;
      }
    );
  }

  /**
   * Checks and updates channel-mention related states.
   * Called from onMessageChange().
   */
  private handleChannelMention() {
    this.mentionService.checkForChannelSign(
      this.inputData,
      this.messageTextarea,
      this.mirrorElement,
      (val) => (this.showChannelListTextArea = val),
      (uids) => (this.filteredChannelUids = uids),
      (bottom, left) => {
        this.channelListBottom = bottom;
        this.channelListLeft = left;
      }
    );
  }

  /**
   * Sets the placeholder for a new chat.
   */
  private setPlaceholderNewChat() {
    this.placeholder.set('Starte eine neue Nachricht');
  }

  /**
   * Sets the placeholder for a direct chat.
   */
  private setPlaceholderDirectChat() {
    if (this.receiverId) this.getReceiverName(this.receiverId);
  }

  /**
   * Sets the placeholder for a channel.
   */
  private setPlaceholderChannel() {
    const channelId = this.messagePath.split('/')[2];
    this.getChannelName(channelId);
  }

  /**
   * Updates the current message with the text to edit if available.
   * @param changes - The set of changed properties
   */
  private handleChangeMessageToEdit(changes: SimpleChanges) {
    if (changes['messageToEdit']) {
      this.inputData.message = this.messageToEdit
        ? this.messageToEdit.value.text
        : '';
    }
  }

  /**
   * Updates the placeholder if the message path or receiver changes.
   * @param changes - The set of changed properties
   */
  private handleChangePathOrReceiver(changes: SimpleChanges) {
    if (changes['messagePath'] || changes['receiverId']) {
      this.setPlaceholder();
    }
  }

  /**
   * Checks if the input data contains any text.
   * @returns True if the message has content, otherwise false.
   */
  private hasMessageContent(): boolean {
    return this.inputData.message.length !== 0;
  }

  /**
   * Checks if the user is editing an existing message.
   * @returns True if editing, otherwise false.
   */
  private editingExistingMessage(): boolean {
    return this.messageToEdit !== undefined;
  }

  /**
   * Updates an existing message with the current input text.
   */
  private updateEditedMessage() {
    if (!this.messageToEdit) return;
    this.messageToEdit.value.text = this.inputData.message;
    this.mainService.updateMessage(this.messageToEdit);
    this.messageToEdit = undefined;
  }

  /**
   * Sends a new message via the MainService.
   */
  private sendNewMessage() {
    this.mainService.sendMessage(
      this.messagePath,
      this.inputData,
      this.receiverId
    );
  }

  /**
   * Resets the current input data to empty.
   */
  private resetInputData() {
    this.inputData = new InputBoxData('', []);
  }

  /**
   * Sets the cursor position at the end of the textarea content.
   */
  private setCursorToEnd() {
    const textarea = this.messageTextarea.nativeElement;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}
