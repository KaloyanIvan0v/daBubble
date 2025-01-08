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

  /**
   * Returns an observable that notifies subscribers when the message to edit changes.
   * @returns {Observable<Message | null>} - An observable that emits the current message to edit.
   */
  messageOnChange() {
    return this.messageToEdit.asObservable();
  }

  /**
   * Sets the message to be edited.
   * @param {Message | null} message - The message to edit, or null to clear the message to edit.
   */
  setMessageToEdit(message: Message | null) {
    this.messageToEdit.next(message);
  }
}
