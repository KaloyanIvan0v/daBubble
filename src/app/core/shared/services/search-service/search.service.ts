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
  headerSearchResults: any[] = [];
  newChatSearchResults: any[] = [];
  headerSelectedIndex: number = -1;
  newChatSelectedIndex: number = -1;
  searchQuery: string = '';
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
    this.authService
      .getCurrentUserUID()
      .then((uid) => (this.loggedInUserId = uid));
  }

  async onSelectResult(result: any): Promise<void> {
    if (!this.loggedInUserId) {
      console.error('Sender ID is null');
      return;
    }
    if (result.type === 'channel') await this.selectChannel(result);
    else if (result.type === 'user') await this.selectUser(result);
    else console.error('Unknown result type:', result);
  }

  private async selectUser(result: any): Promise<void> {
    this.setUserSelection(result);
    const chatId = this.generateChatId(this.loggedInUserId!, result.uid);
    await this.ensureDirectChatExists(chatId, result);
    this.navigateToDirectChat(chatId);
  }

  private setUserSelection(result: any): void {
    this.searchQuery = `@${result.name}`;
    this.selectedUserPhotoURL = result.photoURL || '';
    this.isSelected = true;
    this.selectedUserId = result.uid;
    this.selectedChannelName = null;
  }

  private async selectChannel(result: any): Promise<void> {
    this.setChannelSelection(result);
    const exists = await this.firebaseService.checkDocExists(
      'channels',
      result.id
    );
    if (exists) this.navigateToChannelChat(result.id);
  }

  private setChannelSelection(result: any): void {
    this.searchQuery = `#${result.name}`;
    this.selectedUserPhotoURL = '';
    this.isSelected = true;
    this.selectedChannelName = null;
  }

  private async ensureDirectChatExists(
    chatId: string,
    result: any
  ): Promise<void> {
    const exists = await this.firebaseService.checkDocExists(
      'directMessages',
      chatId
    );
    if (!exists) await this.createDirectMessageChat(chatId, result);
  }

  private async createDirectMessageChat(
    chatId: string,
    result: any
  ): Promise<void> {
    const data = this.buildChatData(
      chatId,
      this.loggedInUserId!,
      result.uid,
      result
    );
    await setDoc(
      this.firebaseService.getDocRef('directMessages', chatId),
      data
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

  private generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  navigateToDirectChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
  }

  navigateToChannelChat(channelId: string): void {
    this.router.navigate(['dashboard', 'channel-chat', channelId]);
  }

  onKeyDown(event: KeyboardEvent, context: 'header' | 'newChat'): void {
    const { results, selectedIndex } = this.getContextData(context);
    if (!results.length) return;
    let newIndex = selectedIndex;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = (selectedIndex + 1) % results.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = (selectedIndex - 1 + results.length) % results.length;
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
      event.preventDefault();
      this.onSelectResult(results[selectedIndex]);
    }
    this.setContextIndex(context, newIndex);
  }

  private getContextData(context: 'header' | 'newChat'): {
    results: any[];
    selectedIndex: number;
  } {
    return context === 'header'
      ? {
          results: this.headerSearchResults,
          selectedIndex: this.headerSelectedIndex,
        }
      : {
          results: this.newChatSearchResults,
          selectedIndex: this.newChatSelectedIndex,
        };
  }

  private setContextIndex(context: 'header' | 'newChat', index: number): void {
    if (context === 'header') this.headerSelectedIndex = index;
    else this.newChatSelectedIndex = index;
  }
}
