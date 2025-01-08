import { Injectable, inject, signal } from '@angular/core';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { firstValueFrom, map } from 'rxjs';
import { first } from 'rxjs/operators';
import { Message } from 'src/app/core/shared/models/message.class';
import { Thread } from 'src/app/core/shared/models/thread.class';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private firestore: FirebaseServicesService = inject(FirebaseServicesService);
  private authService: AuthService = inject(AuthService);
  activeMobileUnitId = signal('');

  constructor() {}

  /**
   * Sends a message to a specified path or directly to a receiver.
   * @param messagePath - The path where the message will be sent.
   * @param inputMessage - The input data containing the message and imports.
   * @param receiverId - The ID of the receiver, if any.
   */
  async sendMessage(
    messagePath: string,
    inputMessage: InputBoxData,
    receiverId: string | null
  ) {
    const { collection, docId } = this.parseMessagePath(messagePath);
    const id = this.firestore.getUniqueId();
    const userId = await this.authService.getCurrentUserUID();
    const name = await this.getSpaceName(messagePath);

    const message: Message = this.constructMessage(
      id,
      userId ?? '',
      messagePath,
      inputMessage,
      name,
      receiverId
    );

    await this.sendMessageToPath(
      userId ?? '',
      receiverId,
      messagePath,
      id,
      message
    );
  }

  /**
   * Parses the message path into collection and document ID.
   * @param messagePath - The full message path.
   * @returns An object containing the collection and document ID.
   */
  private parseMessagePath(messagePath: string): {
    collection: string;
    docId: string;
  } {
    const parts = messagePath.split('/');
    return { collection: parts[0], docId: parts[1] };
  }

  /**
   * Constructs a Message object based on provided parameters.
   * @param id - Unique ID for the message.
   * @param userId - ID of the message author.
   * @param messagePath - Path where the message is located.
   * @param inputMessage - Input data containing message details.
   * @param name - Name of the space.
   * @param receiverId - ID of the receiver, if any.
   * @returns A Message object.
   */
  private constructMessage(
    id: string,
    userId: string,
    messagePath: string,
    inputMessage: InputBoxData,
    name: string,
    receiverId: string | null
  ): Message {
    return {
      id,
      author: userId!,
      time: new Date(),
      location: messagePath,
      value: {
        text: inputMessage.message,
        imports: inputMessage.imports,
      },
      thread: new Thread(`${messagePath}/${id}`, name),
      space: name,
      reactions: [],
      receiverId: receiverId || '',
    };
  }

  /**
   * Sends a message to the appropriate path based on receiver ID.
   * @param userId - ID of the message sender.
   * @param receiverId - ID of the receiver, if any.
   * @param messagePath - Original message path.
   * @param id - Unique ID for the message.
   * @param message - The Message object to send.
   */
  private async sendMessageToPath(
    userId: string,
    receiverId: string | null,
    messagePath: string,
    id: string,
    message: Message
  ): Promise<void> {
    const path = receiverId
      ? this.getDirectMessagePath(userId, receiverId, id)
      : `${messagePath}/${id}`;

    console.log(`${receiverId ? 'Direct' : 'Channel'} message path:`, path);
    await this.firestore.sendMessage(path, message);
  }

  /**
   * Constructs the direct message path based on user IDs.
   * @param userId - ID of the sender.
   * @param receiverId - ID of the receiver.
   * @param id - Unique ID for the message.
   * @returns The direct message path.
   */
  private getDirectMessagePath(
    userId: string,
    receiverId: string,
    id: string
  ): string {
    const sortedUserIds = [userId, receiverId].sort();
    return `directMessages/${sortedUserIds.join('_')}/messages/${id}`;
  }

  /**
   * Updates an existing message in the database.
   * @param message - The Message object to update.
   */
  async updateMessage(message: Message) {
    const editedMessage = { ...message, reactions: [...message.reactions] };
    await this.firestore.updateMessage(
      `${message.location}/${message.id}`,
      editedMessage
    );
  }

  /**
   * Retrieves the name of the space based on the message path.
   * @param messagePath - The path of the message.
   * @returns The name of the space.
   */
  async getSpaceName(messagePath: string): Promise<string> {
    const { collection, docId } = this.extractCollectionAndDocId(messagePath);
    if (collection === 'channels') {
      return await this.fetchChannelName(docId);
    }
    return '';
  }

  /**
   * Extracts collection and document ID from the message path.
   * @param messagePath - The full message path.
   * @returns An object containing collection and document ID.
   */
  private extractCollectionAndDocId(messagePath: string): {
    collection: string;
    docId: string;
  } {
    const parts = messagePath.split('/');
    return { collection: parts[1], docId: parts[2] };
  }

  /**
   * Fetches the channel name from the database.
   * @param docId - Document ID of the channel.
   * @returns The channel name.
   */
  private async fetchChannelName(docId: string): Promise<string> {
    const doc = this.firestore.getChannel(docId);
    return await firstValueFrom(doc.pipe(map((d) => d?.name ?? '')));
  }

  /**
   * Sets the current user status to online.
   */
  async setUserOnline() {
    const uid = await this.authService.getCurrentUserUID();
    if (uid) {
      this.updateUserStatus(uid, true);
    }
  }

  /**
   * Sets the current user status to offline.
   */
  async setUserOffline() {
    const uid = await this.authService.getCurrentUserUID();
    if (uid) {
      this.updateUserStatus(uid, false);
    }
  }

  /**
   * Updates the user's online status in the database.
   * @param uid - User ID.
   * @param status - Online status to set.
   */
  private updateUserStatus(uid: string, status: boolean) {
    this.firestore
      .getUser(uid)
      .pipe(first())
      .subscribe((user) => {
        if (user) {
          user.status = status;
          this.firestore.updateUser(user.uid, user);
        }
      });
  }
}
