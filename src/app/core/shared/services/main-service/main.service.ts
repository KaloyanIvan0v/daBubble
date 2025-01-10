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
  // Inject FirebaseServicesService and AuthService using Angular's inject function
  private firestore: FirebaseServicesService = inject(FirebaseServicesService);
  private authService: AuthService = inject(AuthService);

  // Define a reactive signal for the active mobile unit ID
  activeMobileUnitId = signal('');

  constructor() {}

  /**
   * Sends a message to a specified path, either as a direct message or a channel message.
   * @param messagePath - The path where the message should be sent.
   * @param inputMessage - The input data containing the message text and any imports.
   * @param receiverId - The ID of the receiver if it's a direct message; otherwise, null.
   */
  async sendMessage(
    messagePath: string,
    inputMessage: InputBoxData,
    receiverId: string | null
  ) {
    // Extract the collection and document ID from the message path
    const collection = messagePath.split('/')[0];
    const docId = messagePath.split('/')[1];

    // Generate a unique ID for the new message
    const id = this.firestore.getUniqueId();

    // Get the current user's UID
    const userId = await this.authService.getCurrentUserUID();

    // Retrieve the space name based on the message path
    const name: string = await this.getSpaceName(messagePath);

    // Create a plain object for the input message
    const plainInputMessage = {
      text: inputMessage.message,
      imports: inputMessage.imports,
    };

    // Construct the Message object with all required properties
    const message: Message = {
      id: id,
      author: userId!,
      time: new Date(Date.now()),
      location: messagePath,
      value: plainInputMessage,
      thread: JSON.parse(
        JSON.stringify(new Thread(messagePath + '/' + id, name))
      ),
      space: name,
      reactions: [],
      receiverId: receiverId || '',
    };

    // Send the message to the appropriate path
    await this.sendMessageToPath(
      userId ?? '',
      receiverId,
      messagePath,
      id,
      message
    );
  }

  /**
   * Determines the correct path and sends the message either as a direct message or a channel message.
   * @param userId - The ID of the user sending the message.
   * @param receiverId - The ID of the receiver if it's a direct message.
   * @param messagePath - The base path where the message should be sent.
   * @param id - The unique ID of the message.
   * @param message - The Message object to be sent.
   */
  private async sendMessageToPath(
    userId: string,
    receiverId: string | null,
    messagePath: string,
    id: string,
    message: Message
  ): Promise<void> {
    if (receiverId) {
      // If there's a receiver ID, construct the direct message path
      const sortedUserIds = [userId, receiverId].sort();
      const directMessagePath = `directMessages/${sortedUserIds.join(
        '_'
      )}/messages`;

      // Send the message to the direct message path
      await this.firestore.sendMessage(directMessagePath + '/' + id, message);
    } else {
      // If no receiver ID, send the message to the channel path
      await this.firestore.sendMessage(messagePath + '/' + id, message);
    }
  }

  /**
   * Updates an existing message in the Firestore database.
   * @param message - The Message object containing updated data.
   */
  async updateMessage(message: Message) {
    // Create a deep copy of the message with necessary fields
    const editedMessage: Message = {
      id: message.id,
      author: message.author!,
      time: message.time,
      location: message.location,
      value: message.value,
      thread: message.thread,
      space: message.space,
      reactions: JSON.parse(JSON.stringify(message.reactions)),
      receiverId: message.receiverId || '',
    };

    // Update the message in Firestore using the message's location and ID
    await this.firestore.updateMessage(
      message.location + '/' + message.id,
      editedMessage
    );
  }

  /**
   * Retrieves the name of the space (e.g., channel) based on the message path.
   * @param messagePath - The path of the message.
   * @returns A promise that resolves to the name of the space.
   */
  async getSpaceName(messagePath: string): Promise<string> {
    // Extract collection and document ID from the message path
    let collection = messagePath.split('/')[1];
    let docId = messagePath.split('/')[2];

    if (collection === 'channels') {
      // If the collection is 'channels', fetch the channel document
      const doc = this.firestore.getChannel(docId);

      // Extract the name from the channel document or return an empty string
      const name = await firstValueFrom(
        doc.pipe(map((doc) => doc?.name ?? ''))
      );
      return name;
    } else {
      // If not a channel, return an empty string
      return '';
    }
  }

  /**
   * Sets the current user’s status to online in the Firestore database.
   */
  async setUserOnline() {
    // Get the current user's UID
    const uid = await this.authService.getCurrentUserUID();
    if (uid) {
      // Fetch the user document from Firestore
      this.firestore
        .getUser(uid)
        .pipe(first())
        .subscribe((user) => {
          if (user) {
            // Update the user's status to online
            user.status = true;
            this.firestore.updateUser(user.uid, user);
          }
        });
    }
  }

  /**
   * Sets the current user’s status to offline in the Firestore database.
   */
  async setUserOffline() {
    // Get the current user's UID
    const uid = await this.authService.getCurrentUserUID();
    if (uid) {
      // Fetch the user document from Firestore
      this.firestore
        .getUser(uid)
        .pipe(first())
        .subscribe((user) => {
          if (user) {
            // Update the user's status to offline
            user.status = false;
            this.firestore.updateUser(user.uid, user);
          }
        });
    }
  }
}
