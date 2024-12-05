import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { MainService } from '../../../../shared/services/main-service/main.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';
import { setDoc } from '@angular/fire/firestore';
import { User } from 'src/app/core/shared/models/user.class';
import { Observable } from 'rxjs';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [InputBoxComponent, FormsModule, CommonModule],
  templateUrl: './new-chat.component.html',
  styleUrl: './new-chat.component.scss',
})
export class NewChatComponent {
  searchQuery: string = '';
  searchResults: any[] = [];
  searchText: string = '';
  isSearching: boolean = false;
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;
  selectedChannelName: string | null = null;
  isAutoSelected: boolean = false;
  isSelected: boolean = false;
  loggedInUserId: string | null = null;
  selectedUserId: string | null = null;
  messagePath: string = '';
  channelName: string = '';
  channelDescription: string = '';

  userData$: Observable<any>;

  constructor(
    private mainService: MainService,
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    private router: Router
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
    });

    const channelId = this.workspaceService.getActiveChannelId();
    if (channelId) {
      console.log('Retrieved Channel ID:', channelId);
    } else {
      console.warn('No Channel ID available.');
    }
  }

  @ViewChild('searchInput', { static: false }) searchContainer!: ElementRef;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;

    if (
      this.searchContainer &&
      !this.searchContainer.nativeElement.contains(event.target) &&
      !clickedElement.classList.contains('clear-button')
    ) {
      this.searchResults = [];
    }
  }

  onSearchChange(): void {
    const searchText = this.searchQuery.trim();

    if (searchText) {
      this.handleSearchQuery(searchText);
    } else {
      this.clearSearchState();
    }
  }

  handleSearchQuery(searchText: string): void {
    this.searchResults = [];
    this.firebaseService.search(searchText).subscribe(
      (results) => {
        this.searchResults = results.filter(
          (result) => result.uid !== this.loggedInUserId
        );
      },
      (error) => {
        console.error('Error fetching search results:', error);
      }
    );
  }

  clearSearchState(): void {
    this.searchResults = [];
    this.selectedUserPhotoURL = null;
    this.selectedUserName = null;
    this.isSelected = false;
    this.selectedChannelName = null;
    this.isAutoSelected = false;
  }

  async onSelectResult(result: any): Promise<void> {
    const senderId = this.loggedInUserId;
    const receiverId = result.uid;

    if (!senderId) {
      console.error('Sender ID is null');
      return;
    }

    if (result.name) {
      if (result.email) {
        this.handleUserSelection(result);
        await this.handleDirectChat(senderId, receiverId, result);
      } else {
        this.handleChannelSelection(result);
        await this.handleChannelChat(result);
      }
    } else if (result.email) {
      this.handleDirectMessaging(result);
      await this.handleDirectChat(senderId, receiverId, result);
    }
  }

  async handleDirectChat(
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    const chatId = this.generateChatId(senderId, receiverId);

    try {
      const chatExists = await this.firebaseService.checkDocExists(
        'directMessages',
        chatId
      );

      if (chatExists) {
        this.navigateToDirectChat(chatId);
      } else {
        await this.createDirectMessageChat(
          chatId,
          senderId,
          receiverId,
          result
        );
        this.navigateToDirectChat(chatId);
      }
    } catch (error) {
      console.error('Error checking or creating direct message chat:', error);
    }
  }

  navigateToDirectChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
  }

  async handleChannelChat(result: any): Promise<void> {
    const channelId = result.id;
    const channelName = result.name;

    if (!channelId) {
      console.error('Channel ID is undefined or invalid:', result);
      return;
    }

    console.log('Navigating to Channel:', channelId);

    try {
      const chatExists = await this.firebaseService.checkDocExists(
        'channelChats',
        channelId
      );

      if (chatExists) {
        this.navigateToChannelChat(channelId);
      } else {
        await this.createChannelChat(channelId, channelName, result);
        this.navigateToChannelChat(channelId);
      }
    } catch (error) {
      console.error('Error checking or creating channel chat:', error);
    }
  }

  async createChannelChat(
    channelId: string,
    channelName: string,
    result: any
  ): Promise<void> {
    const chatData = {
      id: channelId,
      name: channelName,
      description: result.description || '',
      creator: result.creator || '',
      timestamp: new Date(),
      members: result.uid || [],
    };

    try {
      const chatDocRef = this.firebaseService.getDocRef(
        'channelChats',
        channelId
      );
      await setDoc(chatDocRef, chatData);
      console.log(
        `Channel chat created successfully for channel: ${channelName}`
      );
    } catch (error) {
      console.error('Error creating channel chat:', error);
    }
  }

  navigateToChannelChat(channelId: string): void {
    if (!channelId) {
      console.error('Invalid channelId for navigation:', channelId);
      return;
    }

    console.log('Navigating to dashboard/channel-chat:', channelId);
    this.router.navigate(['dashboard', 'channel-chat', channelId]);
  }

  handleUserSelection(result: any): void {
    this.searchQuery = `@${result.name}`;
    this.selectedUserPhotoURL = result.photoURL || '';
    this.isSelected = true;
    this.selectedUserId = result.uid;
    this.selectedChannelName = null;
  }

  handleChannelSelection(result: any): void {
    this.searchQuery = `#${result.name}`;
    this.selectedUserPhotoURL = '';
    this.isSelected = true;
    this.selectedChannelName = null;
  }

  handleDirectMessaging(result: any): void {
    this.searchQuery = result.email;
    this.isSelected = true;
  }

  async handleChatCreation(
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    const chatId = this.generateChatId(senderId, receiverId);

    try {
      const chatExists = await this.checkChatExists(chatId);
      if (chatExists) {
        this.navigateToDirectChat(chatId);
      } else {
        await this.initiateChat(chatId, senderId, receiverId, result);
      }
      this.clearSearchResults();
    } catch (error) {
      console.error('Error during chat creation:', error);
    }
  }

  private async checkChatExists(chatId: string): Promise<boolean> {
    try {
      return await this.firebaseService.checkDocExists(
        'directMessages',
        chatId
      );
    } catch (error) {
      console.error('Error checking if chat exists:', error);
      return false;
    }
  }

  private async initiateChat(
    chatId: string,
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    try {
      await this.createDirectMessageChat(chatId, senderId, receiverId, result);
      this.navigateToDirectChat(chatId);
    } catch (error) {
      console.error('Error creating or navigating to chat:', error);
    }
  }

  private clearSearchResults(): void {
    this.searchResults = [];
  }

  generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  async createDirectMessageChat(
    chatId: string,
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    const chatData = this.buildChatData(chatId, senderId, receiverId, result);
    await setDoc(
      this.firebaseService.getDocRef('directMessages', chatId),
      chatData
    );
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
      sender: { uid: senderId, name: result.name, photoURL: result.photoURL },
      receiver: {
        uid: receiverId,
        name: result.name,
        photoURL: result.photoURL,
      },
    };
  }

  onMessageSent(): void {
    if (this.selectedUserId) {
      const senderId = this.loggedInUserId!;
      const receiverId = this.selectedUserId;
      const chatId = this.generateChatId(senderId, receiverId);
      this.navigateToDirectChat(chatId);
    }
  }

  selectedIndex: number = -1;

  onKeyDown(event: KeyboardEvent) {
    if (!this.searchResults.length) return;

    if (event.key === 'ArrowDown') {
      this.handleArrowDown(event);
    } else if (event.key === 'ArrowUp') {
      this.handleArrowUp(event);
    } else if (event.key === 'Enter' && this.selectedIndex >= 0) {
      this.handleEnter(event);
    }
  }

  private handleArrowDown(event: KeyboardEvent) {
    this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
    event.preventDefault();
  }

  private handleArrowUp(event: KeyboardEvent) {
    this.selectedIndex =
      (this.selectedIndex - 1 + this.searchResults.length) %
      this.searchResults.length;
    event.preventDefault();
  }

  private handleEnter(event: KeyboardEvent) {
    this.onSelectResult(this.searchResults[this.selectedIndex]);
    event.preventDefault();
  }
}
