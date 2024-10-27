import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  chatListOpen: boolean = false;

  constructor(private router: Router) {}

  toggleChatList() {
    this.chatListOpen = !this.chatListOpen;
  }

  navigateToChat() {
    this.router.navigate(['dashboard', 'direct-chat']);
  }

  openDirectChat() {
    this.navigateToChat();
  }
}
