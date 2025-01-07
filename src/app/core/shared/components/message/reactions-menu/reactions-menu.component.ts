import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../../emoji-picker/emoji-picker.component';
import { Message } from 'src/app/core/shared/models/message.class';
import { Reaction } from 'src/app/core/shared/models/reaction.class';
import { EmojiPickerService } from '../../../services/emoji-picker/emoji-picker.service';
import { MessageService } from '../../../services/message-service/message.service';
import { ThreadService } from '../../../services/thread-service/thread.service';
import { StatefulWindowServiceService } from '../../../services/stateful-window-service/stateful-window-service.service';

@Component({
  selector: 'app-reactions-menu',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent],
  templateUrl: './reactions-menu.component.html',
  styleUrls: ['./reactions-menu.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReactionsMenuComponent implements OnInit {
  @Input() loggedInUserId: string = '';
  @Input() message!: Message;
  @Input() lastTwoReactions: string[] = [];
  @Input() ownMessage: boolean = false;
  @Input() showThread: boolean = true;
  @Input() channelUsersUid: string[] = [];
  @Output() messageToEdit = new EventEmitter<Message>();

  showEmojiPicker = false;
  showEditMessage = false;
  selectedEmoji: string = '';
  currentUserId: string = '';

  constructor(
    private emojiPickerService: EmojiPickerService,
    private messageService: MessageService,
    private threadService: ThreadService,
    private statefulWindowService: StatefulWindowServiceService
  ) {}

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   * Converts raw reaction data to instances of the Reaction class.
   */
  ngOnInit() {
    this.convertReactionToInstance();
  }

  /**
   * Converts raw reaction data from the message into instances of the `Reaction` class.
   * Ensures that each reaction is properly instantiated for further processing.
   */
  convertReactionToInstance() {
    if (!this.message.reactions) {
      this.message.reactions = [];
    } else {
      this.message.reactions = this.message.reactions.map(
        (reactionData) =>
          new Reaction(
            reactionData.id,
            reactionData.authors,
            reactionData.value
          )
      );
    }
  }

  /**
   * Toggles the visibility of the emoji picker.
   * If the emoji picker is currently shown, it will be hidden, and vice versa.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Closes the emoji picker by setting its visibility to false.
   * This method is useful for ensuring the emoji picker is hidden when needed.
   */
  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  /**
   * Toggles the visibility of the edit message interface.
   * If the edit message interface is currently shown, it will be hidden, and vice versa.
   */
  toggleEditMessage() {
    this.showEditMessage = !this.showEditMessage;
  }

  /**
   * Closes the edit message interface by setting its visibility to false.
   * This method ensures that the edit interface is hidden when not in use.
   */
  closeEditMessage() {
    this.showEditMessage = false;
  }

  /**
   * Emits the current message to be edited.
   * This allows parent components to handle the editing process based on the emitted message.
   */
  editMessage() {
    this.messageToEdit.emit(this.message);
  }

  /**
   * Handles the event when an emoji is selected from the emoji picker.
   * Adds the selected emoji as a reaction to the message and closes the emoji picker.
   * @param emoji - The emoji string selected by the user.
   */
  onEmojiSelected(emoji: string) {
    this.emojiPickerService.addReaction(emoji, this.message);
    this.toggleEmojiPicker();
  }

  /**
   * Lifecycle hook that is called just before the component is destroyed.
   * Ensures that the emoji picker is closed to prevent any lingering UI elements.
   */
  ngOnDestroy(): void {
    this.showEmojiPicker = false;
  }

  /**
   * Opens the thread associated with the current message.
   * Sets up necessary services and adjusts the UI based on the device's screen width.
   */
  openThread() {
    this.threadService.channelUsersUid.next(this.channelUsersUid);
    this.threadService.openThread(this.message);
    this.statefulWindowService.openRightSideComponentState();
    if (window.innerWidth < 960) {
      this.statefulWindowService.openThreadOnMobile();
    }
  }
}
