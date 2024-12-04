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
  selectedIndex: number = -1;
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
  }

  @ViewChild('searchInput', { static: false }) searchContainer!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const clickedElement = event.target as HTMLElement;
    if (this.isClickOutsideSearch(clickedElement)) {
      this.clearSearchState();
    }
  }

  private isClickOutsideSearch(clickedElement: HTMLElement): boolean {
    return (
      this.searchContainer &&
      !this.searchContainer.nativeElement.contains(clickedElement) &&
      !clickedElement.classList.contains('clear-button')
    );
  }

  onSearchChange(): void {
    const searchText = this.searchQuery.trim();
    searchText ? this.handleSearchQuery(searchText) : this.clearSearchState();
  }

  handleSearchQuery(searchText: string): void {
    this.firebaseService.search(searchText).subscribe(
      (results) => {
        this.filterSearchResults(results);
      },
      (error) => console.error('Error fetching search results:', error)
    );
  }

  private filterSearchResults(results: any[]): void {
    this.searchResults = results.filter(
      (result) => result.uid !== this.loggedInUserId
    );
  }

  clearSearchState(): void {
    this.searchResults = [];
    this.resetSelection();
  }

  private resetSelection(): void {
    this.selectedUserPhotoURL = null;
    this.isSelected = false;
    this.selectedUserId = null;
    this.selectedIndex = -1; // Reset index on clearing
  }

  async onSelectResult(result: any): Promise<void> {
    const senderId = this.loggedInUserId;
    const receiverId = result.uid;

    if (!senderId) {
      console.error('Sender ID is null');
      return;
    }

    this.selectedUserId = receiverId;
    this.messagePath = `directMessages/${this.generateChatId(
      senderId,
      receiverId
    )}`;
    result.name
      ? this.handleUserOrChannelSelection(result, senderId, receiverId)
      : this.handleDirectMessaging(result, senderId, receiverId);
  }

  private handleUserOrChannelSelection(
    result: any,
    senderId: string,
    receiverId: string
  ): void {
    result.email
      ? this.prepareUserSelection(result, senderId, receiverId)
      : this.prepareChannelSelection(result);
  }

  private async prepareUserSelection(
    result: any,
    senderId: string,
    receiverId: string
  ): Promise<void> {
    this.handleUserSelection(result);
    await this.checkOrCreateChat(senderId, receiverId, result);
  }

  private handleUserSelection(result: any): void {
    this.searchQuery = `@${result.name}`;
    this.selectedUserPhotoURL = result.photoURL || '';
    this.isSelected = true;
    this.selectedUserId = result.uid;
  }

  private prepareChannelSelection(result: any): void {
    this.searchQuery = `#${result.name}`;
    this.selectedUserPhotoURL = null;
    this.isSelected = true;
  }

  private async handleDirectMessaging(
    result: any,
    senderId: string,
    receiverId: string
  ): Promise<void> {
    this.searchQuery = result.email;
    this.isSelected = true;
    await this.checkOrCreateChat(senderId, receiverId, result);
  }

  private async checkOrCreateChat(
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
      chatExists
        ? this.navigateToDirectChat(chatId)
        : await this.createDirectMessageChat(
            chatId,
            senderId,
            receiverId,
            result
          );
    } catch (error) {
      console.error('Error handling chat creation:', error);
    }
  }

  generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  private async createDirectMessageChat(
    chatId: string,
    senderId: string,
    receiverId: string,
    result: any
  ): Promise<void> {
    const chatData = this.buildChatData(chatId, senderId, receiverId, result);

    try {
      const chatDocRef = this.firebaseService.getDocRef(
        'directMessages',
        chatId
      );
      await setDoc(chatDocRef, chatData);
      this.navigateToDirectChat(chatId);
    } catch (error) {
      console.error('Error creating direct message chat:', error);
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

  onMessageSent(): void {
    // Placeholder for further actions when a message is sent
    console.log('Message sent successfully');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!this.searchResults.length) return;

    event.key === 'ArrowDown'
      ? this.selectNextResult(event)
      : event.key === 'ArrowUp'
      ? this.selectPreviousResult(event)
      : event.key === 'Enter' && this.selectedIndex >= 0
      ? this.onEnterKey(event)
      : null;
  }

  private selectNextResult(event: KeyboardEvent): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
    event.preventDefault();
  }

  private selectPreviousResult(event: KeyboardEvent): void {
    this.selectedIndex =
      (this.selectedIndex - 1 + this.searchResults.length) %
      this.searchResults.length;
    event.preventDefault();
  }

  private onEnterKey(event: KeyboardEvent): void {
    this.onSelectResult(this.searchResults[this.selectedIndex]);
    event.preventDefault();
  }
}
