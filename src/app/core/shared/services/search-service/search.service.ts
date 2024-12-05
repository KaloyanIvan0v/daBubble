import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth-services/auth.service';
import { WorkspaceService } from '../workspace-service/workspace.service';
import { FirebaseServicesService } from '../firebase/firebase.service';
import { Router } from '@angular/router';
import { setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  searchQuery: string = '';
  searchResults: any[] = [];
  searchText: string = '';
  isSearching: boolean = false;
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;
  selectedChannelName: string | null = null;
  isSelected: boolean = false;
  selectedUserId: string | null = null;
  loggedInUserId: string | null = null;

  userData$: Observable<any>;

  constructor(
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public firebaseService: FirebaseServicesService,
    public router: Router
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
    });
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
        console.log('Channel ID:', result.id);
        this.handleChannelSelection(result);
        await this.handleChannelChat(result);
      }
    } else if (result.email) {
      this.handleDirectMessaging(result);
      await this.handleDirectChat(senderId, receiverId, result);
    }
  }

  handleDirectMessaging(result: any): void {
    this.searchQuery = result.email;
    this.isSelected = true;
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

  generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
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

  navigateToDirectChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
  }

  async handleChannelChat(result: any): Promise<void> {
    const channelId = result.id;

    if (!channelId) {
      console.error('Channel ID is undefined or invalid:', result);
      return;
    }

    console.log('Navigating to Channel:', channelId);

    try {
      const channelExists = await this.firebaseService.checkDocExists(
        'channels',
        channelId
      );

      if (channelExists) {
        this.navigateToChannelChat(channelId);
      }
    } catch (error) {
      console.error('Error checking or creating channel chat:', error);
    }
  }

  navigateToChannelChat(channelId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', channelId]);
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
