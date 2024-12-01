import { Injectable } from '@angular/core';
import { FirebaseServicesService } from '../firebase/firebase.service';
import { AuthService } from '../auth-services/auth.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { Reaction } from 'src/app/core/shared/models/reaction.class';

@Injectable({
  providedIn: 'root',
})
export class EmojiPickerService {
  constructor(
    private firebaseService: FirebaseServicesService,
    private authService: AuthService
  ) {}

  async addReaction(emoji: string, message: Message): Promise<void> {
    try {
      const currentUserId = await this.authService.getCurrentUserUID();
      if (!currentUserId) {
        return;
      }
      this.processReaction(emoji, message, currentUserId);
      this.updateMessageData(message);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Reaktion:', error);
    }
  }

  private processReaction(
    emoji: string,
    message: Message,
    currentUserId: string
  ): void {
    let reaction = this.findReaction(emoji, message);

    if (!reaction) {
      reaction = this.createReaction(emoji, currentUserId);
      message.reactions.push(reaction);
    } else {
      this.updateReactionAuthors(reaction, currentUserId, message);
    }
  }

  private findReaction(emoji: string, message: Message): Reaction | undefined {
    return message.reactions.find((r: Reaction) => r.value === emoji);
  }

  private createReaction(emoji: string, currentUserId: string): Reaction {
    const newReactionId = this.firebaseService.getUniqueId();
    return new Reaction(newReactionId, [currentUserId], emoji);
  }

  private updateReactionAuthors(
    reaction: Reaction,
    currentUserId: string,
    message: Message
  ): void {
    const userIndex = reaction.authors.indexOf(currentUserId);
    if (userIndex === -1) {
      reaction.authors.push(currentUserId);
    } else {
      reaction.authors.splice(userIndex, 1);
      if (reaction.authors.length === 0) {
        this.removeReaction(reaction, message);
      }
    }
  }

  private removeReaction(reaction: Reaction, message: Message): void {
    const reactionIndex = message.reactions.indexOf(reaction);
    if (reactionIndex !== -1) {
      message.reactions.splice(reactionIndex, 1);
    }
  }

  private updateMessageData(message: Message): void {
    const reactionsPlain = this.getPlainReactions(message);
    const messageData = this.createMessageData(message, reactionsPlain);
    this.saveMessageData(messageData);
  }

  private getPlainReactions(message: Message): any[] {
    return message.reactions.map((r: Reaction) => r.toPlainObject());
  }

  private createMessageData(message: Message, reactionsPlain: any[]): Message {
    return {
      ...message,
      reactions: reactionsPlain,
    };
  }

  private saveMessageData(messageData: Message): void {
    const messagePath = `${messageData.location}/${messageData.id}`;
    this.firebaseService.updateMessage(messagePath, messageData);
  }
}
