import { Injectable, SimpleChanges } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../../models/message.class';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  currentThreadPath: BehaviorSubject<string> = new BehaviorSubject<string>('');
  //threadOpen: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  originMessage: BehaviorSubject<Message | null> =
    new BehaviorSubject<Message | null>(null);
  constructor() {}

  OnChanges(changes: SimpleChanges) {
    console.log(changes);
  }

  openThread(message: Message) {
    this.currentThreadPath.next(
      message.location + '/' + message.id + '/messages'
    );
    this.originMessage.next(message);
  }
}
