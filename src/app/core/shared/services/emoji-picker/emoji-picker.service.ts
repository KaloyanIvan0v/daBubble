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

  /**
   * Adds a reaction to the message.
   * @param emoji - The emoji to be added as a reaction.
   * @param message - The message to add the reaction to.
   * @returns A promise that resolves when the reaction has been added.
   */
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

  /**
   * Processes a reaction to the given message.
   * If the reaction does not yet exist, it will be created.
   * Otherwise, the reaction's authors will be updated.
   * @param emoji - The emoji to be added as a reaction.
   * @param message - The message to add the reaction to.
   * @param currentUserId - The ID of the currently logged in user.
   */
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

  /**
   * Searches for a reaction in the message that matches the given emoji.
   * @param emoji - The emoji to search for within the message's reactions.
   * @param message - The message containing the reactions to be searched.
   * @returns The matching Reaction object if found, otherwise undefined.
   */

  private findReaction(emoji: string, message: Message): Reaction | undefined {
    return message.reactions.find((r: Reaction) => r.value === emoji);
  }

  /**
   * Creates a new Reaction object with the given emoji and adds the current user as an author.
   * @param emoji - The emoji to be added as a reaction.
   * @param currentUserId - The ID of the currently logged in user.
   * @returns The newly created Reaction object.
   */
  private createReaction(emoji: string, currentUserId: string): Reaction {
    const newReactionId = this.firebaseService.getUniqueId();
    return new Reaction(newReactionId, [currentUserId], emoji);
  }

  /**
   * Updates the authors of the given reaction within the given message.
   * If the current user is not an author of the reaction, adds them.
   * If the current user is already an author, removes them.
   * @param reaction - The reaction to be updated.
   * @param currentUserId - The ID of the currently logged in user.
   * @param message - The message containing the reaction to be updated.
   */
  private updateReactionAuthors(
    reaction: Reaction,
    currentUserId: string,
    message: Message
  ): void {
    const userIndex = reaction.authors.indexOf(currentUserId);

    if (userIndex === -1) {
      reaction.authors.push(currentUserId);
    } else {
      this.removeUserFromReaction(reaction, userIndex, message);
    }
  }

  /**
   * Removes a user from the authors of a given reaction.
   * If the user is the last author of the reaction, the reaction is removed from the message.
   * @param reaction - The reaction from which the user will be removed.
   * @param userIndex - The index of the user to be removed in the reaction's authors array.
   * @param message - The message containing the reaction to be updated.
   */

  private removeUserFromReaction(
    reaction: Reaction,
    userIndex: number,
    message: Message
  ): void {
    reaction.authors.splice(userIndex, 1);
    if (reaction.authors.length === 0) {
      this.removeReaction(reaction, message);
    }
  }

  /**
   * Removes a reaction from the given message.
   * Finds the index of the given reaction within the message's reactions array and
   * removes it if found.
   * @param reaction - The reaction to be removed from the message.
   * @param message - The message containing the reaction to be removed.
   */
  private removeReaction(reaction: Reaction, message: Message): void {
    const reactionIndex = message.reactions.indexOf(reaction);
    if (reactionIndex !== -1) {
      message.reactions.splice(reactionIndex, 1);
    }
  }

  /**
   * Updates the message data with the current state of its reactions.
   * Converts the reactions to a plain object format, creates a new message data object,
   * and saves the updated message data.
   * @param message - The message whose data is to be updated.
   */

  private updateMessageData(message: Message): void {
    const reactionsPlain = this.getPlainReactions(message);
    const messageData = this.createMessageData(message, reactionsPlain);
    this.saveMessageData(messageData);
  }

  /**
   * Converts the reactions of the given message to a plain object format.
   * Each Reaction object in the message is mapped to a plain object
   * using the Reaction.toPlainObject() method.
   * @param message - The message whose reactions are to be converted.
   * @returns An array of plain objects representing the reactions of the message.
   */
  private getPlainReactions(message: Message): any[] {
    return message.reactions.map((r: Reaction) => r.toPlainObject());
  }

  /**
   * Creates a new message object with the given message and reactions data.
   * Creates a shallow copy of the given message object and sets its reactions
   * property to the given array of plain objects. The returned message object
   * is a new object and does not modify the original message object.
   * @param message - The original message object.
   * @param reactionsPlain - The array of plain objects representing the reactions.
   * @returns A new message object with the given reactions data.
   */
  private createMessageData(message: Message, reactionsPlain: any[]): Message {
    return {
      ...message,
      reactions: reactionsPlain,
    };
  }

  /**
   * Saves the updated message data to the Firebase database.
   * Constructs the message path using the message's location and ID,
   * and calls the Firebase service to update the message.
   * @param messageData - The message data to be saved, including its location and ID.
   */

  private saveMessageData(messageData: Message): void {
    const messagePath = `${messageData.location}/${messageData.id}`;
    this.firebaseService.updateMessage(messagePath, messageData);
  }
}
