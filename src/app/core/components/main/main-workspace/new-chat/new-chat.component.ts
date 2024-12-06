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
import { Observable } from 'rxjs';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [InputBoxComponent, FormsModule, CommonModule],
  templateUrl: './new-chat.component.html',
  styleUrl: './new-chat.component.scss',
})
export class NewChatComponent implements OnInit {
  searchQuery: string = '';
  prefillValue: string | null = null;

  searchText: string = '';
  isSearching: boolean = false;
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;
  selectedChannelName: string | null = null;
  isSelected: boolean = false;
  loggedInUserId: string | null = null;
  selectedUserId: string | null = null;
  messagePath: string = '';
  channelName: string = '';
  channelDescription: string = '';

  userData$: Observable<any>;

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public searchService: SearchService,
    private route: ActivatedRoute
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

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const prefillValue = params.get('prefill');
      if (prefillValue) {
        this.searchQuery = prefillValue;
        this.onSearchChange();
      }
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
      this.searchService.newChatSearchResults = [];
    }
  }

  onSearchChange(): void {
    const searchText = this.searchQuery.trim();
    if (searchText && this.loggedInUserId) {
      this.firebaseService.search(searchText, this.loggedInUserId).subscribe(
        (results) => {
          const filteredResults =
            this.searchService.filterOutLoggedInUser(results);
          this.searchService.newChatSearchResults = filteredResults;

          // If we have a prefill channel, automatically select it
          if (this.prefillValue && this.prefillValue.startsWith('#')) {
            const channelName = this.prefillValue.slice(1); // remove '#'
            const channelResult = filteredResults.find(
              (res) => res.type === 'channel' && res.name === channelName
            );

            if (channelResult) {
              this.searchService.onSelectResult(channelResult).then(() => {
                // Channel selected, set messagePath for this channel
                this.selectedChannelName = channelResult.name;
                this.isSelected = true;
                this.messagePath = `channels/${channelResult.id}/messages`;
              });
            }
          }
        },
        (error) => {
          console.error('Error fetching search results:', error);
        }
      );
    } else {
      this.clearSearchState();
    }
  }

  clearSearchState(): void {
    this.searchService.newChatSearchResults = [];
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
      const chatExists = await this.checkChatExists(chatId);
      if (chatExists) {
        this.searchService.navigateToDirectChat(chatId);
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
      this.searchService.navigateToDirectChat(chatId);
    } catch (error) {
      console.error('Error creating or navigating to chat:', error);
    }
  }

  private clearSearchResults(): void {
    this.searchService.newChatSearchResults = [];
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
      this.searchService.navigateToDirectChat(chatId);
    }
  }
}
