import { SearchService } from './../../../../shared/services/search-service/search.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { setDoc } from '@angular/fire/firestore';
import { Observable, takeUntil, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { ActivatedRoute } from '@angular/router';
import { User } from 'src/app/core/shared/models/user.class';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { UserListComponent } from 'src/app/core/shared/components/user-list/user-list.component';
import { ChannelsListComponent } from 'src/app/core/shared/components/channels-list/channels-list.component';

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
  styleUrl: './new-chat.component.scss',
})
export class NewChatComponent implements OnInit {
  searchQuery: string = '';
  prefillValue: string | null = null;

  isSelected: boolean = false;
  loggedInUserId: string | null = null;
  selectedUserId: string | null = null;
  messagePath: string = '';
  selectedChannelName: string | null = null;
  isSearching: boolean = false;
  userData$: Observable<any>;
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;

  users: User[] = [];
  channels: Channel[] = [];
  inputValue: string = '';
  filteredUsers: string[] = [];
  filteredChannels: Channel[] = [];
  showResults: boolean = false;

  @ViewChild('searchInput', { static: false }) searchContainer!: ElementRef;

  private destroy$ = new Subject<void>();

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public searchService: SearchService,
    private route: ActivatedRoute
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
    this.logActiveChannel();
  }

  ngOnInit(): void {
    this.subscribeToQueryParams();
    this.loadUsers();
    this.loadChannels();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.firebaseService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
        console.log('Users:', this.users);
      });
  }

  loadChannels(): void {
    this.firebaseService
      .getChannels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((channels) => {
        this.channels = channels;
        console.log('Channels:', this.channels);
      });
  }

  search(): void {
    if (this.inputValue !== '') {
      this.showResults = true;
      if (this.firstLetterIs(this.inputValue, '@')) {
        this.filteredUsers = this.searchUsers(this.inputValue);
        console.log('Filtered Users:', this.filteredUsers);
      } else if (this.firstLetterIs(this.inputValue, '#')) {
        this.filteredChannels = this.searchChannels(this.inputValue);
        console.log('Filtered Channels:', this.filteredChannels);
      } else {
        this.filteredUsers = this.searchEmail(this.inputValue);
        console.log('Filtered Users:', this.filteredUsers);
      }
    } else {
      this.showResults = false;
      this.filteredUsers = [];
      this.filteredChannels = [];
    }
  }

  firstLetterIs(input: string, letter: string): boolean {
    if (input.length > 0) {
      return input[0] === letter;
    }
    return false;
  }

  removeFirstLetter(input: string): string {
    if (input.length > 0) {
      return input.slice(1);
    }
    return input;
  }

  searchChannels(input: string): Channel[] {
    const channelName: string = this.removeFirstLetter(input).toLowerCase();
    return this.channels.filter((channel: Channel) =>
      channel.name.toLowerCase().startsWith(channelName)
    );
  }

  searchUsers(input: string): string[] {
    const userName: string = this.removeFirstLetter(input).toLowerCase();
    return this.users
      .filter((user: User) => user.name.toLowerCase().startsWith(userName))
      .map((user: User) => user.uid);
  }

  searchEmail(input: string): string[] {
    const inputToLowerCase: string = input.toLowerCase();
    return this.users
      .filter((user: User) =>
        user.email.toLowerCase().startsWith(inputToLowerCase)
      )
      .map((user: User) => user.uid);
  }

  onFocusOut(): void {
    this.showResults = false;
    this.inputValue = '';
    this.filteredUsers = [];
    this.filteredChannels = [];
  }

  private logActiveChannel(): void {
    const channelId = this.workspaceService.getActiveChannelId();
    if (channelId) {
      console.log('Retrieved Channel ID:', channelId);
    } else {
      console.warn('No Channel ID available.');
    }
  }

  private subscribeToQueryParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      const prefill = params.get('prefill');
      if (prefill) {
        this.prefillValue = prefill;
        this.searchQuery = prefill;
        this.onSearchChange();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (
      this.searchContainer &&
      !this.searchContainer.nativeElement.contains(clickedElement) &&
      !clickedElement.classList.contains('clear-button')
    ) {
      this.searchService.newChatSearchResults = [];
    }
  }

  onSearchChange(): void {
    const trimmedQuery = this.searchQuery.trim();
    if (trimmedQuery && this.loggedInUserId) {
      this.fetchSearchResults(trimmedQuery);
    } else {
      this.clearSearchState();
    }
  }

  private fetchSearchResults(query: string): void {
    this.isSearching = true;
    this.firebaseService.search(query, this.loggedInUserId!).subscribe(
      (results) => this.processSearchResults(results),
      (error) => {
        console.error('Error fetching search results:', error);
        this.isSearching = false;
      }
    );
  }

  private processSearchResults(results: any[]): void {
    const filtered = this.searchService.filterOutLoggedInUser(results);
    this.searchService.newChatSearchResults = filtered;
    this.isSearching = false;
    this.autoSelectPrefillChannel(filtered);
  }

  private autoSelectPrefillChannel(results: any[]): void {
    if (this.prefillValue && this.prefillValue.startsWith('#')) {
      const channelName = this.prefillValue.slice(1);
      const channel = results.find(
        (res) => res.type === 'channel' && res.name === channelName
      );
      if (channel) {
        this.selectChannel(channel);
      }
    }
  }

  private selectChannel(channel: any): void {
    this.searchService.onSelectResult(channel).then(() => {
      this.selectedChannelName = channel.name;
      this.isSelected = true;
      this.messagePath = `channels/${channel.id}/messages`;
    });
  }

  private clearSearchState(): void {
    this.clearSearchResults();
    this.resetSelection();
  }

  private clearSearchResults(): void {
    this.searchService.newChatSearchResults = [];
  }

  private resetSelection(): void {
    this.selectedUserPhotoURL = null;
    this.selectedUserName = null;
    this.isSelected = false;
    this.selectedChannelName = null;
  }

  async handleChatCreation(
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    const chatId = this.generateChatId(senderId, receiverId);
    try {
      const exists = await this.checkChatExists(chatId);
      exists
        ? this.navigateToChat(chatId)
        : await this.createAndNavigateChat(
            chatId,
            senderId,
            receiverId,
            result
          );
      this.clearSearchResults();
    } catch (error) {
      console.error('Error during chat creation:', error);
    }
  }

  private generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  private async checkChatExists(chatId: string): Promise<boolean> {
    try {
      return await this.firebaseService.checkDocExists(
        'directMessages',
        chatId
      );
    } catch (error) {
      console.error('Error checking chat existence:', error);
      return false;
    }
  }

  private navigateToChat(chatId: string): void {
    this.searchService.navigateToDirectChat(chatId);
  }

  private async createAndNavigateChat(
    chatId: string,
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    await this.createDirectMessageChat(chatId, senderId, receiverId, result);
    this.navigateToChat(chatId);
  }

  private async createDirectMessageChat(
    chatId: string,
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    const chatData = this.buildChatData(chatId, senderId, receiverId, result);
    try {
      await setDoc(
        this.firebaseService.getDocRef('directMessages', chatId),
        chatData
      );
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }

  private buildChatData(
    chatId: string,
    senderId: string,
    receiverId: string,
    result: any
  ): any {
    return {
      uid: [senderId, receiverId],
      id: chatId,
      timestamp: new Date(),
      sender: {
        uid: senderId,
        name: result.name,
        photoURL: result.photoURL,
      },
      receiver: {
        uid: receiverId,
        name: result.name,
        photoURL: result.photoURL,
      },
    };
  }

  onMessageSent(): void {
    if (this.selectedUserId && this.loggedInUserId) {
      const chatId = this.generateChatId(
        this.loggedInUserId,
        this.selectedUserId
      );
      this.searchService.navigateToDirectChat(chatId);
    }
  }
}
