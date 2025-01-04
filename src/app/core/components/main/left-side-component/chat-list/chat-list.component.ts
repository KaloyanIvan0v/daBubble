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
    this.getLoggedInUserID().then((uid) => {
      this.loggedInUserId = uid;
      this.chatsWithUsers$ = this.getAllDirectChats().pipe(
        switchMap((chats: DirectMessage[]) => {
          const chatObservables = this.getAllChatsWithUserObservables(
            chats,
            uid
          );
          return this.combineChatsWithUsers(chatObservables);
        })
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getLoggedInUserID(): Promise<string | null> {
    return this.authService.getCurrentUserUID();
  }

  private getAllDirectChats(): Observable<any> {
    return this.firebaseService.getChats();
  }

  private getChatWithUser(
    chat: DirectMessage,
    currentUserId: string | null
  ): Observable<{ chat: DirectMessage; user: User | null }> {
    const otherUserId = chat.uid.find((uid) => uid !== currentUserId);
    if (!otherUserId) {
      return of({ chat, user: null });
    }
    return this.firebaseService
      .getUser(otherUserId)
      .pipe(map((user) => ({ chat, user })));
  }

  private getAllChatsWithUserObservables(
    chats: DirectMessage[],
    currentUserId: string | null
  ): Array<Observable<{ chat: DirectMessage; user: User | null }>> {
    return chats.map((chat) => this.getChatWithUser(chat, currentUserId));
  }

  private combineChatsWithUsers(
    chatUserObservables: Array<
      Observable<{ chat: DirectMessage; user: User | null }>
    >
  ): Observable<Array<{ chat: DirectMessage; user: User | null }>> {
    return combineLatest(chatUserObservables);
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
