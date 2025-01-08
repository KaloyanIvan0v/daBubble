import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../../models/message.class';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  currentThreadPath: BehaviorSubject<string> = new BehaviorSubject<string>('');
  originMessage: BehaviorSubject<Message | null> =
    new BehaviorSubject<Message | null>(null);
  channelUsersUid: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(
    []
  );
  constructor() {}

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Opens a thread based on the given message.
   *
   * If the given message is undefined, does nothing.
   * Otherwise, updates the current thread path and origin message.
   * @param message The message to open a thread for.
   */
  /******  9dc55e05-39a1-4383-99f4-c42339a77291  *******/
  openThread(message: Message | undefined) {
    if (!message) return;
    this.currentThreadPath.next(
      message.location + '/' + message.id + '/messages'
    );
    this.originMessage.next(message);
  }
}
