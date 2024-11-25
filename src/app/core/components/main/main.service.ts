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

  async sendMessage(messagePath: string, inputMessage: InputBoxData) {
    const id = this.firestore.getUniqueId();
    const userId = await this.authService.getCurrentUserUID();
    const name: string = await this.getSpaceName(messagePath);

    const plainInputMessage = {
      text: inputMessage.message,
      imports: inputMessage.imports,
    };
    console.log(name);

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
    };

    await this.firestore.sendMessage(messagePath + '/' + id, message);
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
