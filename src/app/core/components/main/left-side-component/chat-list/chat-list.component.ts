import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { DirectChatService } from 'src/app/core/shared/services/direct-chat-services/direct-chat.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements OnInit {
  chatListOpen: boolean = false;
  directChats: DirectMessage[] = [];

  constructor(
    private router: Router,
    public firebaseService: FirebaseServicesService,
    public directChatService: DirectChatService
  ) {}

  ngOnInit(): void {
    this.directChatService.getChats();
    this.directChatService.directChats.subscribe((directChat) => {
      this.directChats = directChat;
    });
  }

  navigateToDirectChat() {}

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
