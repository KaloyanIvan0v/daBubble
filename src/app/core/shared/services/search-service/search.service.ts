import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth-services/auth.service';
import { WorkspaceService } from '../workspace-service/workspace.service';
import { FirebaseServicesService } from '../firebase/firebase.service';
import { Router } from '@angular/router';
import { setDoc } from 'firebase/firestore';
import { StatefulWindowServiceService } from '../stateful-window-service/stateful-window-service.service';

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
    public router: Router,
    public statefulWindowService: StatefulWindowServiceService
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
    if (result.type === 'channel') {
      await this.handleChannelChat(result);
    } else if (result.type === 'user') {
      await this.selectUser(result);
    } else {
      console.error('Unknown result type:', result);
    }
  }

  private async handleChannelChat(result: any): Promise<void> {
    const channelId = result.id;
    if (!channelId)
      return console.error('Channel ID is undefined or invalid:', result);

    try {
      const channelExists = await this.firebaseService.checkDocExists(
        'channels',
        channelId
      );
      if (!channelExists) return this.navigateToNewChatWithPrefill(result.name);

      const isMember = await this.isUserMemberOfChannel(channelId);
      this.navigateToChat(isMember, channelId, result.name);
    } catch (error) {
      console.error('Error checking channel existence or membership:', error);
    }
  }

  private async isUserMemberOfChannel(channelId: string): Promise<boolean> {
    const channelData = await this.firebaseService.getDocOnce(
      'channels',
      channelId
    );
    return channelData?.uid?.includes(this.loggedInUserId) ?? false;
  }

  private navigateToChat(
    isMember: boolean,
    channelId: string,
    name: string
  ): void {
    isMember
      ? this.navigateToChannelChat(channelId)
      : this.navigateToNewChatWithPrefill(name);
  }

  private navigateToNewChatWithPrefill(channelName: string): void {
    this.router.navigate(['dashboard', 'new-chat'], {
      queryParams: { prefill: `#${channelName}` },
    });
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

  private async ensureDirectChatExists(
    chatId: string,
    result: any
  ): Promise<void> {
    const exists = await this.firebaseService.checkDocExists(
      'directMessages',
      chatId
    );
    if (!exists) {
      await this.createDirectMessageChat(chatId, result);
    }
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
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  navigateToChannelChat(channelId: string): void {
    this.router.navigate(['dashboard', 'channel-chat', channelId]);
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  public filterOutLoggedInUser(results: any[]): any[] {
    if (!this.loggedInUserId) return results;
    return results.filter(
      (res) => !(res.type === 'user' && res.uid === this.loggedInUserId)
    );
  }
}
