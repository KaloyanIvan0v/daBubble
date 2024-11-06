import { Injectable, inject } from '@angular/core';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Thread } from '../../shared/models/thread.class';
import { firstValueFrom, map } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

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
    const name: string = await firstValueFrom(
      this.getSpaceName(collection, docId)
    );
    const plainInputMessage = {
      text: inputMessage.message,
      imports: inputMessage.imports,
    };
    const message = {
      id: id,
      author: userId!,
      time: new Date(Date.now()),
      value: plainInputMessage,
      thread: {},
      space: name,
      reactions: {},
    };
    await this.firestore.sendMessage(collection, docId, message);
  }
  getSpaceName(collection: string, docId: string) {
    const doc = this.firestore.getDoc<{ name: string }>(collection, docId);
    return doc.pipe(map((doc) => doc.name));
  }
}
