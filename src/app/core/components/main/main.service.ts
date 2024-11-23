import { Injectable, inject } from '@angular/core';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { firstValueFrom, map } from 'rxjs';
import { Message } from 'src/app/core/shared/models/message.class';
import { Reaction } from 'src/app/core/shared/models/reaction.class';
import { Thread } from 'src/app/core/shared/models/thread.class';

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private firestore: FirebaseServicesService = inject(FirebaseServicesService);
  private authService: AuthService = inject(AuthService);

  constructor() {}

  async sendMessage(
    collection: string,
    docId: string,
    inputMessage: InputBoxData
  ) {
    const id = this.firestore.getUniqueId();
    const userId = await this.authService.getCurrentUserUID();
    const name: string = await this.getSpaceName(collection, docId);

    const plainInputMessage = {
      text: inputMessage.message,
      imports: inputMessage.imports,
    };

    const message: Message = {
      id: id,
      author: userId!,
      time: new Date(Date.now()),
      location: { collection: collection, docId: docId },
      value: plainInputMessage,
      thread: JSON.parse(JSON.stringify(new Thread('', '', []))),
      space: name,
      reactions: [],
    };

    await this.firestore.sendMessage(collection, docId, message);
  }

  async updateMessage(message: Message) {
    const editedMessage: Message = {
      id: message.id,
      author: message.author!,
      time: message.time,
      location: {
        collection: message.location.collection,
        docId: message.location.docId,
      },
      value: message.value,
      thread: message.thread,
      space: message.space,
      reactions: JSON.parse(JSON.stringify(message.reactions)),
    };
    await this.firestore.updateMessage(
      message.location.collection,
      message.location.docId,
      message.id,
      editedMessage
    );
  }

  async getSpaceName(collection: string, docId: string): Promise<string> {
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
