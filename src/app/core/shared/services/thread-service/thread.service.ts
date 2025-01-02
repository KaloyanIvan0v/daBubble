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

  openThread(message: Message) {
    this.currentThreadPath.next(
      message.location + '/' + message.id + '/messages'
    );
    this.originMessage.next(message);
  }
}
