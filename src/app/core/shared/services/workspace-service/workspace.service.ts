import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  channelId = signal('');
  chatId = signal('');

  constructor() {}
}
