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
  searchQuery: string = ''; // This will bind to the input field
  searchResults: any[] = [];
  searchText: string = '';
  isSearching: boolean = false;
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;
  selectedChannelName: string | null = null;
  isAutoSelected: boolean = false;
  isSelected: boolean = false;
  loggedInUserId: string | null = null;

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
      } else {
        this.handleChannelSelection(result);
      }
      await this.handleChatCreation(senderId, receiverId, result);
    } else if (result.email) {
      this.handleDirectMessaging(result);
      await this.handleChatCreation(senderId, result.uid, result);
    }
  }

  // Handle user selection
  handleUserSelection(result: any): void {
    this.searchQuery = `@${result.name}`;
    this.selectedUserPhotoURL = result.photoURL || '';
    this.isSelected = true;
  }

  // Handle channel selection
  handleChannelSelection(result: any): void {
    this.searchQuery = `#${result.name}`;
    this.selectedUserPhotoURL = ''; // No photo for channels
    this.isSelected = true;
  }

  // Handle direct messaging when only an email is provided
  handleDirectMessaging(result: any): void {
    this.searchQuery = result.email;
    this.isSelected = true;
  }

  // Handle checking and creating a chat if necessary
  async handleChatCreation(
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
        // Chat doesn't exist, create a new one
        await this.createDirectMessageChat(
          chatId,
          senderId,
          receiverId,
          result
        );
      }

      this.searchResults = []; // Clear search results
    } catch (error) {
      console.error('Error checking or creating direct message chat:', error);
    }
  }

  navigateToDirectChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
  }

  // Generate a unique chat ID for the sender and receiver
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
    const directMessage = new DirectMessage(
      [senderId, receiverId],
      chatId,
      senderId,
      receiverId,
      new Date(),
      []
    );

    const chatData = {
      uid: [senderId, receiverId],
      id: chatId,
      timestamp: directMessage.timestamp,
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

    try {
      const chatDocRef = this.firebaseService.getDocRef(
        'directMessages',
        chatId
      );
      await setDoc(chatDocRef, chatData);

      console.log('Direct message chat created successfully');
    } catch (error) {
      console.error('Error creating direct message chat:', error);
    }
  }

  selectedIndex: number = -1;

  onKeyDown(event: KeyboardEvent) {
    if (!this.searchResults.length) return;

    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.searchResults.length) %
        this.searchResults.length;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.selectedIndex >= 0) {
      this.onSelectResult(this.searchResults[this.selectedIndex]);

      event.preventDefault();
    }
  }
}
