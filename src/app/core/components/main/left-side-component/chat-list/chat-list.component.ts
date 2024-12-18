import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';
import { Observable, switchMap, map, of, combineLatest, Subject } from 'rxjs';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { User } from 'src/app/core/shared/models/user.class';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';
@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
})
export class ChatListComponent implements OnInit {
  chatListOpen: boolean = false;
  loggedInUserId: string | null = null;
  selectedChatId: string | null = null;

  chatsWithUsers$!: Observable<{ chat: DirectMessage; user: User | null }[]>;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public firebaseService: FirebaseServicesService,
    public authService: AuthService,
    public workspaceService: WorkspaceService,
    private statefulWindowService: StatefulWindowServiceService
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToDirectChat(chatId: string): void {
    this.selectedChatId = chatId;
    this.setCurrentActiveUnitId(chatId);
    this.router.navigate(['dashboard', 'direct-chat', chatId]);

    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  setCurrentActiveUnitId(chatId: string): void {
    this.workspaceService.currentActiveUnitId.set(chatId);
  }

  toggleChatList(): void {
    this.chatListOpen = !this.chatListOpen;
  }

  get currentActiveUnitId() {
    return this.workspaceService.currentActiveUnitId();
  }
}
