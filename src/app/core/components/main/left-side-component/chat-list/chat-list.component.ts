import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { DirectChatService } from 'src/app/core/shared/services/direct-chat-services/direct-chat.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';
import {
  Observable,
  BehaviorSubject,
  switchMap,
  map,
  of,
  combineLatest,
} from 'rxjs';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { User } from 'src/app/core/shared/models/user.class';

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

  chatsWithUsers$!: Observable<{ chat: DirectMessage; user: User | null }[]>;

  constructor(
    private router: Router,
    public firebaseService: FirebaseServicesService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;

      // Combine chats and corresponding users into a single observable
      this.chatsWithUsers$ = this.firebaseService.getDirectChats().pipe(
        switchMap((chats: DirectMessage[]) => {
          const chatsWithUserObservables = chats.map((chat) => {
            const otherUserId = chat.uid.find(
              (uid) => uid !== this.loggedInUserId
            );
            if (otherUserId) {
              return this.firebaseService
                .getUser(otherUserId)
                .pipe(map((user) => ({ chat, user })));
            } else {
              return of({ chat, user: null });
            }
          });
          return combineLatest(chatsWithUserObservables);
        })
      );
    });
  }

  navigateToDirectChat(chatId: string): void {
    this.router.navigate(['direct-chat', chatId]);
  }

  toggleChatList(): void {
    this.chatListOpen = !this.chatListOpen;
  }
}
