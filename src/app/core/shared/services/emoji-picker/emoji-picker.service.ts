import { Injectable, inject } from '@angular/core';
import { FirebaseServicesService } from '../firebase/firebase.service';
import { AuthService } from '../auth-services/auth.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { Reaction } from 'src/app/core/shared/models/reaction.class';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  private firebaseService: FirebaseServicesService = inject(
    FirebaseServicesService
  );
  private authService: AuthService = inject(AuthService);
  currentUserId: string = '';
  message!: Message;

  addReaction(emoji: string, message: Message) {
    this.message = message;
    this.authService.getCurrentUserUID().then((currentUserId) => {
      this.currentUserId = currentUserId as string;
      this.processReaction(emoji);
      this.updateMessageData();
    });
  }

  private processReaction(emoji: string) {
    let reaction = this.findReaction(emoji);

    if (!reaction) {
      reaction = this.createReaction(emoji);
      this.message.reactions.push(reaction);
    } else {
      this.updateReactionAuthors(reaction);
    }
  }

  private findReaction(emoji: string): Reaction | undefined {
    return this.message.reactions.find((r: Reaction) => r.value === emoji);
  }

  private createReaction(emoji: string): Reaction {
    const newReactionId = this.firebaseService.getUniqueId();
    return new Reaction(newReactionId, [this.currentUserId], emoji);
  }

  private updateReactionAuthors(reaction: Reaction) {
    const userIndex = reaction.authors.indexOf(this.currentUserId);
    if (userIndex === -1) {
      reaction.authors.push(this.currentUserId);
    } else {
      reaction.authors.splice(userIndex, 1);
      if (reaction.authors.length === 0) {
        this.removeReaction(reaction);
      }
    }
  }

  private removeReaction(reaction: Reaction) {
    const reactionIndex = this.message.reactions.indexOf(reaction);
    if (reactionIndex !== -1) {
      this.message.reactions.splice(reactionIndex, 1);
    }
  }

  private updateMessageData() {
    const reactionsPlain = this.getPlainReactions();
    const messageData = this.createMessageData(reactionsPlain);
    this.saveMessageData(messageData);
  }

  private getPlainReactions() {
    return this.message.reactions.map((r: Reaction) => r.toPlainObject());
  }

  private createMessageData(reactionsPlain: any): any {
    return {
      ...this.message,
      reactions: reactionsPlain,
    };
  }

  private saveMessageData(messageData: any) {
    const messagePath = messageData.location + '/' + messageData.id;
    this.firebaseService.updateMessage(messagePath, messageData);
  }

  constructor() {}
}
