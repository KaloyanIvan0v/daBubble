import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private currentChannelIdSource = new BehaviorSubject<string>('');
  private currentDirectChatIdSource = new BehaviorSubject<string>('');

  currentChannelId$ = this.currentChannelIdSource.asObservable();
  currentDirectChatId$ = this.currentDirectChatIdSource.asObservable();

  constructor() {}

  setCurrentChannelId(id: string): void {
    this.currentChannelIdSource.next(id);
  }
  setCurrentDirectChatId(id: string): void {
    this.currentDirectChatIdSource.next(id);
  }
}
