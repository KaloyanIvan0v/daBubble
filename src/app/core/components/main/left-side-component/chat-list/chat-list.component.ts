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

  /**
   * This lifecycle hook is called after the component's view has been
   * initialized. During this lifecycle hook, the component gets the
   * logged in user's ID and fetches all direct chats for this user.
   * It then combines all direct chats with their respective users
   * and assigns the result to the "chatsWithUsers$" observable.
   */
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

  /**
   * Takes a DirectMessage and the currently logged in user's ID and
   * returns an observable that resolves to a chat with the user
   * that is not the currently logged in user. If the chat is only
   * between the currently logged in user and one other user, the
   * returned observable will be of type { chat: DirectMessage; user: User }.
   * If the chat has more than two users, the returned observable will
   * be of type { chat: DirectMessage; user: null }.
   * @param chat The DirectMessage to get the other user from.
   * @param currentUserId The ID of the currently logged in user.
   */
  private getChatWithUser(
    chat: DirectMessage,
    currentUserId: string | null
  ): Observable<{ chat: DirectMessage; user: User | null }> {
    // 1) Prüfen, ob es einen "anderen" User gibt
    let otherUserId = chat.uid.find((uid) => uid !== currentUserId);

    // 2) Wenn otherUserId nicht gefunden wurde, könnte es sein,
    //    dass der User mit sich selbst chattet (beide UIDs sind gleich).
    if (!otherUserId) {
      // Prüfen, ob alle UIDs dem aktuellen User entsprechen
      const allAreCurrentUser = chat.uid.every((uid) => uid === currentUserId);
      if (allAreCurrentUser && currentUserId) {
        // Dann haben wir es mit einem "Self-Chat" zu tun
        otherUserId = currentUserId;
      }
    }

    // 3) Wenn otherUserId nach dieser Logik immer noch undefined ist,
    //    geben wir ein Objekt mit `user: null` zurück.
    if (!otherUserId) {
      return of({ chat, user: null });
    }

    // Ansonsten laden wir den User ganz normal aus Firebase
    return this.firebaseService
      .getUser(otherUserId)
      .pipe(map((user) => ({ chat, user })));
  }

  /**
   * Takes an array of DirectMessage objects and the currently logged in user's ID,
   * and returns an array of observables. Each observable resolves to an object containing
   * a chat and the user involved in that chat who is not the currently logged in user.
   * If a chat is only between the logged in user and one other user, the user field in
   * the returned object will contain the other user's data. If the chat has more than
   * two users, the user field will be null.
   *
   * @param chats An array of DirectMessage objects representing the chats.
   * @param currentUserId The ID of the currently logged in user.
   * @returns An array of observables, each resolving to an object with a chat and a user.
   */

  private getAllChatsWithUserObservables(
    chats: DirectMessage[],
    currentUserId: string | null
  ): Array<Observable<{ chat: DirectMessage; user: User | null }>> {
    return chats.map((chat) => this.getChatWithUser(chat, currentUserId));
  }

  /**
   * Takes an array of observables, each of which resolves to an object with a DirectMessage
   * and the user involved in that chat who is not the currently logged in user, and returns
   * an observable that resolves to an array of all of those objects.
   * @param chatUserObservables An array of observables, each resolving to an object with a chat
   * and a user.
   * @returns An observable that resolves to an array of all of the chat-user objects.
   */
  private combineChatsWithUsers(
    chatUserObservables: Array<
      Observable<{ chat: DirectMessage; user: User | null }>
    >
  ): Observable<Array<{ chat: DirectMessage; user: User | null }>> {
    return combineLatest(chatUserObservables);
  }

  /**
   * Navigates to the direct chat page with the given chat ID.
   * Additionally sets the currently selected chat ID and the current active unit ID.
   * If the window width is smaller than 960px, opens the chat on mobile devices.
   * @param chatId The ID of the chat to navigate to.
   */
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
