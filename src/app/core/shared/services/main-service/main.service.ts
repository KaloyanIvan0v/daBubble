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

  constructor() {}

  async sendMessage(
    messagePath: string,
    inputMessage: InputBoxData,
    receiverId: string | null
  ) {
    console.log('Message path:', messagePath);
    console.log('Receiver ID:', receiverId);

    const id = this.firestore.getUniqueId();
    const userId = await this.authService.getCurrentUserUID();

    const message = await this.createMessage(
      id,
      messagePath,
      inputMessage,
      receiverId,
      userId!
    );

    const targetPath = receiverId
      ? this.getDirectMessagePath(userId!, receiverId, id)
      : `${messagePath}/${id}`;

    console.log(
      receiverId ? 'Direct message path:' : 'Channel message path:',
      targetPath
    );

    await this.sendToFirestore(targetPath, message);
  }

  private async createMessage(
    id: string,
    messagePath: string,
    inputMessage: InputBoxData,
    receiverId: string | null,
    userId: string
  ): Promise<Message> {
    const name = await this.getSpaceName(messagePath);

    const plainInputMessage = this.buildPlainInputMessage(inputMessage);

    return {
      id: id,
      author: userId,
      time: new Date(),
      location: messagePath,
      value: plainInputMessage,
      thread: this.createThread(messagePath, id, name),
      space: name,
      reactions: [],
      receiverId: receiverId || '',
    };
  }

  private buildPlainInputMessage(inputMessage: InputBoxData) {
    return {
      text: inputMessage.message,
      imports: inputMessage.imports,
    };
  }

  private createThread(messagePath: string, id: string, name: string): Thread {
    return JSON.parse(JSON.stringify(new Thread(`${messagePath}/${id}`, name)));
  }

  private getDirectMessagePath(
    userId: string,
    receiverId: string,
    id: string
  ): string {
    const sortedUserIds = [userId, receiverId].sort();
    return `directMessages/${sortedUserIds.join('_')}/messages/${id}`;
  }

  private async sendToFirestore(path: string, message: Message): Promise<void> {
    await this.firestore.sendMessage(path, message);
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
}
