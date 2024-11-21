import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../../emoji-picker/emoji-picker.component';
import { Message } from 'src/app/core/shared/models/message.class';
import { Reaction } from 'src/app/core/shared/models/reaction.class';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { AuthService } from '../../../services/auth-services/auth.service';

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
  selectedEmojis: string[] = [];
  @Input() message!: Message;
  currentUserId: string = '';

  constructor(
    private firebaseService: FirebaseServicesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Convert reactions to Reaction instances
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

  onEmojiSelected(emoji: string) {
    this.authService.getCurrentUserUID().then((currentUserId) => {
      this.currentUserId = currentUserId as string;
      console.log(this.message);

      let reaction = this.message.reactions.find(
        (r: Reaction) => r.value === emoji
      );
      if (!reaction) {
        const newReactionId = this.firebaseService.getUniqueId();
        reaction = new Reaction(newReactionId, [this.currentUserId], emoji);
        this.message.reactions.push(reaction);
      } else {
        const userIndex = reaction.authors.indexOf(this.currentUserId);
        if (userIndex === -1) {
          reaction.authors.push(this.currentUserId);
        } else {
          reaction.authors.splice(userIndex, 1);
          if (reaction.authors.length === 0) {
            const reactionIndex = this.message.reactions.indexOf(reaction);
            if (reactionIndex !== -1) {
              this.message.reactions.splice(reactionIndex, 1);
            }
          }
        }
      }

      const reactionsPlain = this.message.reactions.map((r: Reaction) =>
        r.toPlainObject()
      );
      console.log(reactionsPlain);

      const messageData = {
        ...this.message,
        reactions: reactionsPlain,
      };

      this.firebaseService.updateMessage(
        this.message.location.collection,
        this.message.location.docId,
        this.message.id,
        messageData
      );
    });
    this.showEmojiPicker = false;
  }

  ngOnDestroy(): void {
    this.showEmojiPicker = false;
  }
}
