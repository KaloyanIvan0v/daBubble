import { Component } from '@angular/core';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChannelListComponent } from './channel-list/channel-list.component';

@Component({
  selector: 'app-left-side-component',
  standalone: true,
  imports: [ChannelListComponent, ChatListComponent],
  templateUrl: './left-side-component.component.html',
  styleUrl: './left-side-component.component.scss',
})
export class LeftSideComponentComponent {}
