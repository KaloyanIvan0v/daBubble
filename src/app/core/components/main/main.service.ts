import { Injectable, inject } from '@angular/core';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { firstValueFrom, map } from 'rxjs';
import { Message } from 'src/app/core/shared/models/message.class';
import { Thread } from 'src/app/core/shared/models/thread.class';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private firestore: FirebaseServicesService = inject(FirebaseServicesService);
  private authService: AuthService = inject(AuthService);
  currentUserUid: string | null = null;

  constructor() {
    this.authService.getCurrentUserUID().then((uid) => {
      this.currentUserUid = uid;
    });
  }

  async sendMessage(
    messagePath: string,
    inputMessage: InputBoxData,
    receiverId: string | null
  ) {
    const userId = this.currentUserUid!;
    const id = this.firestore.getUniqueId();
    let name: string = '';

    let finalMessagePath: string;

    if (receiverId) {
      // It's a direct message
      const sortedUserIds = [userId, receiverId].sort();
      const chatId = sortedUserIds.join('_');
      finalMessagePath = `directMessages/${chatId}/messages/${id}`;
      name = await this.getUserName(receiverId);
    } else if (messagePath) {
      // It's a channel message
      finalMessagePath = `${messagePath}/${id}`;
      name = await this.getSpaceName(messagePath);
    } else {
      console.error('Neither receiverId nor messagePath is provided.');
      return;
    }

    // Extract collection and docId if needed
    const collection = finalMessagePath.split('/')[0];
    const docId = finalMessagePath.split('/')[1];

    const plainInputMessage = {
      text: inputMessage.message,
      imports: inputMessage.imports,
    };

    const message: Message = {
      id: id,
      author: userId,
      time: new Date(),
      location: finalMessagePath,
      value: plainInputMessage,
      thread: JSON.parse(JSON.stringify(new Thread(finalMessagePath, name))),
      space: name,
      reactions: [],
      receiverId: receiverId || '',
    };

    await this.firestore.sendMessage(finalMessagePath, message);
  }

  async updateMessage(message: Message) {
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
    await this.firestore.updateMessage(
      message.location + '/' + message.id,
      editedMessage
    );
  }

  async getSpaceName(messagePath: string): Promise<string> {
    let collection = messagePath.split('/')[1];
    let docId = messagePath.split('/')[2];
    if (collection === 'channels') {
      const doc = this.firestore.getChannel(docId);
      const name = await firstValueFrom(
        doc.pipe(map((doc) => doc?.name ?? ''))
      );
      return name;
    } else {
      return '';
    }
  }

  async getUserName(userId: string): Promise<string> {
    const userObservable = this.firestore.getUser(userId);
    const user = await firstValueFrom(
      userObservable.pipe(map((user) => user?.name ?? ''))
    );
    return user;
  }
}
