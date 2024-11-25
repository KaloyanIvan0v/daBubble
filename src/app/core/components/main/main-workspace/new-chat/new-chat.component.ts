import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { Message } from 'src/app/core/shared/models/message.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { MainService } from '../../main.service';
import { InputBoxData } from 'src/app/core/shared/models/input.class';

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

  private messages: Message[] = [];

  newMessageContent: string = '';
  currentChatId: string = ''; // Chat ID (set when navigating to the chat)
  loggedInUserId: string | null = null;
  messagePath: string = ''; // Initially empty, will be set dynamically
  messages$!: Observable<Message[]>;
  messageToEdit: Message | null = null;

  constructor(
    private mainService: MainService,
    public firebaseService: FirebaseServicesService,
    public authService: AuthService
  ) {
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

  async onSendMessage(): Promise<void> {
    const trimmedMessage = this.newMessageContent.trim();
    if (!trimmedMessage) {
      return; // Don't send empty messages
    }

    const userId = this.loggedInUserId; // The sender's ID
    if (!userId) {
      console.error('User is not logged in');
      return;
    }

    let messagePath = '';
    let receiverId: string | null = null;

    if (this.selectedUserName) {
      receiverId = this.selectedUserName;
      messagePath = `directMessages/${userId}_${receiverId}/messages`;
    } else if (this.selectedChannelName) {
      messagePath = `channels/${this.selectedChannelName}/messages`;
    } else {
      console.error('No valid message target selected');
      return;
    }

    const inputMessage = new InputBoxData(trimmedMessage, []);

    try {
      await this.mainService.sendMessage(messagePath, inputMessage, receiverId);
      this.newMessageContent = '';
    } catch (error) {
      console.error('Error while sending message:', error);
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
        this.searchResults = results;
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

  autoSelectUser(user: any): void {
    if (!this.isAutoSelected) {
      this.selectedUserPhotoURL = user.photoURL;
      this.selectedUserName = user.name;
      this.isSelected = true;
      this.searchQuery = `@${user.name}`;
      this.isAutoSelected = true;
      this.searchResults = [];
    }
  }

  onSelectResult(result: any) {
    if (result.name) {
      if (result.email) {
        this.searchQuery = `@${result.name}`;
        this.selectedUserPhotoURL = result.photoURL || '';
        this.isSelected = true;
      } else {
        this.searchQuery = `#${result.name}`;
        this.selectedUserPhotoURL = '';
        this.isSelected = true;
      }
    } else if (result.email) {
      this.searchQuery = result.email;
      this.isSelected = true;
    }
    this.searchResults = [];
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
