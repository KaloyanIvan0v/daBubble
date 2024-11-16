import { Injectable, inject } from '@angular/core';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { firstValueFrom, map } from 'rxjs';

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
