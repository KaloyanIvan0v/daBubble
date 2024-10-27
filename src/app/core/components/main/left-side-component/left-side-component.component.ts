import { Component } from '@angular/core';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-left-side-component',
  standalone: true,
  imports: [ChannelListComponent, ChatListComponent],
  templateUrl: './left-side-component.component.html',
  styleUrl: './left-side-component.component.scss',
})
export class LeftSideComponentComponent {
  constructor(private router: Router) {}
  navigateToNewChat() {
    this.router.navigate(['dashboard', 'new-chat']);
  }

  openNewChat() {
    this.navigateToNewChat();
  }
}
