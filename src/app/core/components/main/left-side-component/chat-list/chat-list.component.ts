import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { DirectChatService } from 'src/app/core/shared/services/direct-chat-services/direct-chat.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';
import { Observable } from 'rxjs';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent implements OnInit {
  chatListOpen: boolean = false;
  loggedInUserId: string | null = null;

  directChats$: Observable<any[]>;
  userData$: Observable<any>;

  constructor(
    private router: Router,
    public firebaseService: FirebaseServicesService,
    public directChatService: DirectChatService,
    public workspaceService: WorkspaceService,
    public authService: AuthService
  ) {
    this.directChats$ = new Observable<any[]>();
    this.userData$ = new Observable<any[]>();
  }

  ngOnInit(): void {
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
      this.directChats$ = this.firebaseService.getDirectChats();
    });
    this.directChats$.subscribe((chats) => {
      console.log('Chats:', chats);
    });
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  navigateToDirectChat(chatId: string): void {
    // Navigate to the selected chat (using chatId)
    console.log('Navigating to chat:', chatId);
  }

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
