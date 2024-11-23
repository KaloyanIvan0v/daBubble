import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from 'src/app/core/shared/models/message.class';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  messageToEdit: BehaviorSubject<Message | null> =
    new BehaviorSubject<Message | null>(null);

  constructor() {
    this.messageOnChange();
  }

  messageOnChange() {
    return this.messageToEdit.asObservable();
  }

  setMessageToEdit(message: Message | null) {
    this.messageToEdit.next(message);
  }
}
