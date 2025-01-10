import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { setDoc } from '@angular/fire/firestore';

import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { SearchService } from 'src/app/core/shared/services/search-service/search.service';

import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { UserListComponent } from 'src/app/core/shared/components/user-list/user-list.component';
import { ChannelsListComponent } from 'src/app/core/shared/components/channels-list/channels-list.component';

import { User } from 'src/app/core/shared/models/user.class';
import { Channel } from 'src/app/core/shared/models/channel.class';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [
    InputBoxComponent,
    FormsModule,
    CommonModule,
    UserListComponent,
    ChannelsListComponent,
  ],
  templateUrl: './new-chat.component.html',
  styleUrls: ['./new-chat.component.scss'],
})
export class NewChatComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput', { static: false }) searchContainer!: ElementRef;

  searchQuery = '';
  prefillValue: string | null = null;
  isSelected = false;
  loggedInUserId: string | null = null;
  selectedUserId: string | null = null;
  messagePath = '';
  selectedChannelName: string | null = null;
  isSearching = false;
  userData$: Observable<any>;
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;
  users: User[] = [];
  channels: Channel[] = [];
  chats: any = [];
  inputValue = '';
  filteredUsers: string[] = [];
  filteredChannels: Channel[] = [];
  showResults = false;
  currentLoggedInUser: User | null = null;

  private destroy$ = new Subject<void>();

  /**
   * Initializes a new instance of the NewChatComponent class.
   * @param firebaseService Handles Firebase operations.
   * @param workspaceService Manages workspace state and user data.
   * @param authService Manages user authentication.
   * @param searchService Provides search-related functions.
   * @param router Service for navigating within the application.
   */
  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public searchService: SearchService,
    private router: Router
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
    const channelId = this.workspaceService.getActiveChannelId();
  }

  /**
   * Lifecycle hook called after component initialization. Loads users, channels, chats,
   * and sets the currently logged-in user.
   */
  ngOnInit(): void {
    this.loadUsers();
    this.loadChannels();
    this.loadChats();
    this.setCurrentLoggedInUser();
  }

  /**
   * Lifecycle hook called when the component is destroyed. Unsubscribes from observables.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Retrieves and sets the current logged-in user data.
   */
  async setCurrentLoggedInUser() {
    const uid = await this.authService.getCurrentUserUID();
    this.firebaseService
      .getUser(uid as string)
      .subscribe((user) => (this.currentLoggedInUser = user));
  }

  /**
   * Fetches the list of all users from Firebase.
   */
  loadUsers(): void {
    this.firebaseService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => (this.users = u));
  }

  /**
   * Fetches the list of all channels from Firebase.
   */
  loadChannels(): void {
    this.firebaseService
      .getChannels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((c) => (this.channels = c));
  }

  /**
   * Fetches the list of all chats from Firebase.
   */
  loadChats(): void {
    this.firebaseService
      .getChats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((chs) => (this.chats = chs));
  }

  /**
   * Performs a search based on the user's input, filtering users or channels as needed.
   */
  search(): void {
    if (!this.inputValue) {
      this.closeSearchResults();
      this.resetFilteredValues();
      return;
    }
    this.showResults = true;
    if (this.inputValue.startsWith('@')) {
      this.filteredUsers = this.searchUsers(this.inputValue.slice(1));
    } else if (this.inputValue.startsWith('#')) {
      this.filteredChannels = this.searchChannels(this.inputValue.slice(1));
    } else {
      this.filteredUsers = this.searchEmail(this.inputValue);
    }
  }

  /**
   * Filters channels by name based on the provided input.
   * @param input The search input for channel names.
   */
  searchChannels(input: string): Channel[] {
    return this.channels.filter((ch) =>
      ch.name.toLowerCase().startsWith(input.toLowerCase())
    );
  }

  /**
   * Filters users by name based on the provided input (excludes the '@' prefix).
   * @param input The search input for user names.
   */
  searchUsers(input: string): string[] {
    return this.users
      .filter((u) => u.name.toLowerCase().startsWith(input.toLowerCase()))
      .map((u) => u.uid);
  }

  /**
   * Filters users by email based on the provided input.
   * @param input The search input for emails.
   */
  searchEmail(input: string): string[] {
    return this.users
      .filter((u) => u.email.toLowerCase().startsWith(input.toLowerCase()))
      .map((u) => u.uid);
  }

  /**
   * Handles focus-out events to close search results, clear inputs,
   * and reset filtered user/channel arrays.
   */
  onFocusOut(): void {
    setTimeout(() => {
      this.closeSearchResults();
      this.clearInput();
      this.resetFilteredValues();
    }, 175);
  }

  /**
   * Resets filtered arrays for users and channels.
   */
  resetFilteredValues(): void {
    this.filteredUsers = [];
    this.filteredChannels = [];
  }

  /**
   * Clears the search input value.
   */
  clearInput(): void {
    this.inputValue = '';
  }

  /**
   * Closes the search results dropdown.
   */
  closeSearchResults(): void {
    this.showResults = false;
  }

  /**
   * Handles selecting a channel from the filtered list.
   * @param channelId The ID of the selected channel.
   */
  onChannelSelected(channelId: string): void {
    this.navigateTo('channel-chat');
    this.workspaceService.currentActiveUnitId.set(channelId);
  }

  /**
   * Opens an existing direct chat or creates a new one if it doesn't exist.
   * @param userUid The UID of the user to chat with.
   */
  async openChat(userUid: string) {
    const chat = this.getChatIdByUserId(userUid);
    this.router.navigate(['dashboard', 'direct-chat', chat.id]);
    this.workspaceService.currentActiveUnitId.set(chat.id);
  }

  /**
   * Processes the selected user and either opens an existing direct chat or creates a new one.
   * @param user The selected user's data.
   */
  onUserSelected(user: User): void {
    if (!this.currentLoggedInUser) return;
    const loggedInUid = this.currentLoggedInUser.uid;
    if (user.uid === loggedInUid) {
      this.handleSelfChat(user.uid);
    } else {
      this.chatExists(user.uid)
        ? this.openChat(user.uid)
        : this.processNewChat(user);
    }
  }

  /**
   * Creates or opens a "self-chat" if the user selects their own account.
   * @param myUid The currently logged-in user's UID.
   */
  private async handleSelfChat(myUid: string) {
    const selfChatId = this.generateChatId(myUid, myUid);
    if (this.chats.some((c: any) => c.id === selfChatId)) {
      this.navigateToChat(selfChatId);
    } else {
      await this.createChatDocument(selfChatId, {
        uid: [myUid, myUid],
        id: selfChatId,
        timestamp: new Date(),
        sender: this.buildSenderData(),
        receiver: this.buildSenderData(),
      });
      this.navigateToChat(selfChatId);
    }
  }

  /**
   * Handles creating a new chat document if none exists for the selected user.
   * @param user The user data for the chat participant.
   */
  private processNewChat(user: User) {
    const senderId = this.currentLoggedInUser!.uid;
    const receiverId = user.uid;
    const newChatId = this.generateChatId(senderId, receiverId);

    this.checkChatExists(newChatId).then((exists) => {
      if (exists) {
        this.navigateToChat(newChatId);
      } else {
        this.createChatDocument(newChatId, {
          uid: [senderId, receiverId],
          id: newChatId,
          timestamp: new Date(),
          sender: this.buildSenderData(),
          receiver: {
            uid: user.uid,
            name: user.name,
            photoURL: user.photoURL,
          },
        }).then(() => this.navigateToChat(newChatId));
      }
    });
  }

  /**
   * Constructs an object representing the current user's identity (sender data).
   */
  private buildSenderData() {
    return {
      uid: this.currentLoggedInUser!.uid,
      name: this.currentLoggedInUser!.name || 'Sender Name',
      photoURL: this.currentLoggedInUser!.photoURL || '',
    };
  }

  /**
   * Navigates to the specified view within the dashboard.
   * @param space The view path within the dashboard.
   */
  private navigateTo(space: string): void {
    this.router.navigate(['dashboard', space]);
  }

  /**
   * Navigates to the direct-chat view for the specified chat ID.
   * @param chatId The ID of the chat to navigate to.
   */
  private navigateToChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
    this.workspaceService.currentActiveUnitId.set(chatId);
  }

  /**
   * Checks if a direct chat already exists with the given user.
   * @param userUid The UID of the user to check.
   */
  private chatExists(userUid: string): boolean {
    const ownUid = this.currentLoggedInUser!.uid;
    return this.chats.some(
      (chat: any) =>
        (chat.sender.uid === ownUid && chat.receiver.uid === userUid) ||
        (chat.receiver.uid === ownUid && chat.sender.uid === userUid)
    );
  }

  /**
   * Retrieves the existing chat object by comparing user UIDs.
   * @param userUid The UID of the user in the existing chat.
   */
  private getChatIdByUserId(userUid: string): any {
    const ownUid = this.currentLoggedInUser!.uid;
    return this.chats.find(
      (chat: any) => chat.uid.includes(ownUid) && chat.uid.includes(userUid)
    );
  }

  /**
   * Generates a unique string for identifying a chat between two users.
   * @param a First user's UID.
   * @param b Second user's UID.
   */
  private generateChatId(a: string, b: string): string {
    return a < b ? `${a}_${b}` : `${b}_${a}`;
  }

  /**
   * Creates a new chat document in Firestore.
   * @param chatId The unique ID for the chat.
   * @param data The initial data object for the chat document.
   */
  private createChatDocument(chatId: string, data: any): Promise<void> {
    const docRef = this.firebaseService.getDocRef('directMessages', chatId);
    return setDoc(docRef, data);
  }

  /**
   * Checks whether a Firestore document with the given chat ID already exists.
   * @param chatId The unique ID to check against the 'directMessages' collection.
   */
  private checkChatExists(chatId: string): Promise<boolean> {
    return this.firebaseService.checkDocExists('directMessages', chatId);
  }
}
