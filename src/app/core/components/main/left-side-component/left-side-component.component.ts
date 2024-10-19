import { Component } from '@angular/core';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChannelChatComponent } from '../main-workspace/channel-chat/channel-chat.component';

@Component({
  selector: 'app-left-side-component',
  standalone: true,
  imports: [ChannelListComponent, ChatListComponent, ChannelChatComponent],
  templateUrl: './left-side-component.component.html',
  styleUrl: './left-side-component.component.scss',
})
export class LeftSideComponentComponent {}
