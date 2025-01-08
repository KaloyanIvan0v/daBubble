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

  /**
   * Ensures that a direct chat with the specified chat ID exists in the Firestore.
   * If the chat does not exist, it creates a new direct message chat.
   * @param chatId The ID of the chat to check or create.
   * @param result The user data used to create a new chat if it doesn't exist.
   */

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

  /**
   * Creates a new direct message chat in the Firestore database.
   * @param chatId The ID of the chat to create.
   * @param result The user data used to create a new chat.
   * @returns A promise that resolves when the chat is created.
   */
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

  /**
   * Builds a direct message chat data object for the Firestore database.
   * @param chatId The ID of the chat to create.
   * @param senderId The UID of the chat sender.
   * @param receiverId The UID of the chat receiver.
   * @param result The user data used to create a new chat.
   * @returns An object containing the chat data.
   */
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

  /**
   * Generates a unique string for identifying a chat between two users.
   * @param senderId The UID of the sender.
   * @param receiverId The UID of the receiver.
   * @returns A string in the format of "senderId_receiverId" or "receiverId_senderId".
   */
  private generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  /**
   * Navigates to the direct chat page for a given chat ID.
   * Opens the chat in mobile view if the screen width is less than 960 pixels.
   * @param chatId The ID of the chat to navigate to.
   */

  navigateToDirectChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  /**
   * Navigates to the channel chat page for a given channel ID.
   * Opens the chat in mobile view if the screen width is less than 960 pixels.
   * @param channelId The ID of the channel to navigate to.
   */
  navigateToChannelChat(channelId: string): void {
    this.router.navigate(['dashboard', 'channel-chat', channelId]);
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  /**
   * Filters out the logged-in user from the provided results.
   * @param results An array of result objects, each potentially representing a user.
   * @returns A filtered array excluding the logged-in user if present in the results.
   */

  public filterOutLoggedInUser(results: any[]): any[] {
    if (!this.loggedInUserId) return results;
    return results.filter(
      (res) => !(res.type === 'user' && res.uid === this.loggedInUserId)
    );
  }
}
