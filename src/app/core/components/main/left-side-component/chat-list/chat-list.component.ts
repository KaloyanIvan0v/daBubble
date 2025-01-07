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
   * Lifecycle hook that is called after the component's view has been initialized.
   * Here, we simply call the refactored method that loads all relevant data.
   */
  ngOnInit(): void {
    this.loadChatsWithUsers();
  }

  /**
   * Retrieves the currently logged-in user's ID, fetches all direct chats,
   * and combines them with their respective user information.
   * The result is then assigned to the `chatsWithUsers$` observable.
   */
  private loadChatsWithUsers(): void {
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

  /**
   * Returns a promise that resolves to the currently logged-in user's ID.
   * @returns A promise that resolves to the user's ID or null if not logged in.
   */
  private getLoggedInUserID(): Promise<string | null> {
    return this.authService.getCurrentUserUID();
  }

  /**
   * Retrieves all direct chats from the Firebase service. The returned
   * observable emits an array of DirectMessage objects, each representing
   * a direct chat.
   * @returns An observable that emits an array of DirectMessage objects.
   */
  private getAllDirectChats(): Observable<any> {
    return this.firebaseService.getChats();
  }

  /**
   * Finds the ID of the other user in the chat, excluding the current user.
   * @param chat The DirectMessage to analyze.
   * @param currentUserId The ID of the currently logged in user.
   * @returns The ID of the other user or null if not found.
   */
  private findOtherUserId(
    chat: DirectMessage,
    currentUserId: string | null
  ): string | null {
    return chat.uid.find((uid) => uid !== currentUserId) || null;
  }

  /**
   * Checks if all users in the chat are the currently logged-in user.
   * @param chat The DirectMessage to analyze.
   * @param currentUserId The ID of the currently logged in user.
   * @returns True if all users are the current user, otherwise false.
   */
  private allUsersAreCurrentUser(
    chat: DirectMessage,
    currentUserId: string | null
  ): boolean {
    return chat.uid.every((uid) => uid === currentUserId);
  }

  /**
   * Fetches a user from the Firebase service by ID.
   * @param userId The ID of the user to fetch.
   * @returns An observable of the User object.
   */
  private fetchUser(userId: string): Observable<User> {
    return this.firebaseService.getUser(userId);
  }

  /**
   * Main function to get the chat with the other user.
   * @param chat The DirectMessage to get the other user from.
   * @param currentUserId The ID of the currently logged in user.
   * @returns An observable resolving to a chat and the other user (or null).
   */
  private getChatWithUser(
    chat: DirectMessage,
    currentUserId: string | null
  ): Observable<{ chat: DirectMessage; user: User | null }> {
    let otherUserId = this.findOtherUserId(chat, currentUserId);

    if (!otherUserId && this.allUsersAreCurrentUser(chat, currentUserId)) {
      otherUserId = currentUserId;
    }
    if (!otherUserId) {
      return of({ chat, user: null });
    }
    return this.fetchUser(otherUserId).pipe(map((user) => ({ chat, user })));
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

  /**
   * Sets the currently active unit ID in the workspace service to the given chat ID.
   * This is used to keep track of which chat is currently selected in the chat list.
   * @param chatId The ID of the chat to set as the currently active unit ID.
   */
  setCurrentActiveUnitId(chatId: string): void {
    this.workspaceService.currentActiveUnitId.set(chatId);
  }

  /**
   * Toggles the chat list open or closed. If the chat list is open,
   * it will be closed, and vice versa.
   */
  toggleChatList(): void {
    this.chatListOpen = !this.chatListOpen;
  }

  /**
   * Gets the currently active unit ID from the workspace service.
   * @returns The currently active unit ID.
   */
  get currentActiveUnitId() {
    return this.workspaceService.currentActiveUnitId();
  }
}
