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
@Component({
  selector: 'app-reactions-menu',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent],
  templateUrl: './reactions-menu.component.html',
  styleUrls: ['./reactions-menu.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReactionsMenuComponent implements OnInit {
  showEmojiPicker = false;
  showEditMessage = false;
  selectedEmoji: string = '';
  @Input() message!: Message;
  @Input() lastTwoReactions: string[] = [];
  @Input() ownMessage: boolean = false;
  @Input() showThread: boolean = true;
  @Output() messageToEdit = new EventEmitter<Message>();
  currentUserId: string = '';

  constructor(
    private emojiPickerService: EmojiPickerService,
    private messageService: MessageService,
    private threadService: ThreadService
  ) {}

  ngOnInit() {
    this.convertReactionToInstance();
  }

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

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  toggleEditMessage() {
    this.showEditMessage = !this.showEditMessage;
  }

  closeEditMessage() {
    this.showEditMessage = false;
  }

  editMessage() {
    this.messageToEdit.emit(this.message);
  }

  onEmojiSelected(emoji: string) {
    this.emojiPickerService.addReaction(emoji, this.message);
    this.toggleEmojiPicker();
  }

  ngOnDestroy(): void {
    this.showEmojiPicker = false;
  }

  openThread() {
    this.threadService.openThread(this.message);
    this.threadService.threadOpen.next(true);
  }
}
