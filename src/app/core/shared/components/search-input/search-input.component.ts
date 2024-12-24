import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/core/shared/services/search-service/search.service';
import { CommonModule } from '@angular/common';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Chat } from 'src/app/core/shared/models/chat.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { ShowUserPipe } from 'src/app/shared/pipes/show-user.pipe';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, ShowUserPipe],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent implements OnInit {
  allMessages: Message[] = [];
  filteredMessages: Message[] = [];
  constructor(
    public firebaseService: FirebaseServicesService,
    public searchService: SearchService,
    private router: Router,

    public workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.getAllMessages();
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const inputText = input.value.toLowerCase();

    if (inputText !== '') {
      this.filteredMessages = this.allMessages
        .filter((message) => {
          const messageText = message.value.text.toLowerCase();
          return messageText.includes(inputText);
        })
        .sort((a, b) => {
          const aText = a.value.text.toLowerCase();
          const bText = b.value.text.toLowerCase();
          const aStarts = aText.startsWith(inputText) ? 0 : 1;
          const bStarts = bText.startsWith(inputText) ? 0 : 1;

          // Nachrichten, die mit dem Suchtext beginnen, sollen zuerst kommen
          return aStarts - bStarts;
        });
    } else {
      this.filteredMessages = [];
    }
  }

  clearInput() {
    const input = document.querySelector('input') as HTMLInputElement;
    input.value = '';
  }

  clearSearch() {
    this.filteredMessages = [];
    this.clearInput();
  }

  openMessage(message: Message) {
    this.clearSearch();
    this.navigateToMessage(message);
  }

  navigateToMessage(message: Message) {
    const spaceId = message.location.split('/')[2];
    const messageId = message.id; // Die eindeutige Nachricht-ID

    if (this.isChannel(message.location)) {
      // Navigiere zum Channel-Chat und übergebe die messageId als Query-Parameter
      this.router.navigate(['dashboard', 'channel-chat', spaceId], {
        queryParams: { messageId },
      });
    } else {
      // Navigiere zum Direkt-Chat
      this.router.navigate(['dashboard', 'direct-chat', spaceId], {
        queryParams: { messageId },
      });
    }
    this.workspaceService.currentActiveUnitId.set(spaceId);
  }

  isChannel(messagePath: string) {
    if (messagePath !== '') {
      return messagePath.split('/')[1] === 'channels';
    } else {
      return false;
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 960;
  }

  getAllMessages() {
    this.allMessages = [];
    this.getAllChatMessages();
    this.getAllChannelMessages();
  }

  getAllChannelMessages() {
    this.firebaseService.getChannels().subscribe((channels: Channel[]) => {
      const allChannels = channels;
      for (const channel of allChannels) {
        this.firebaseService
          .getMessages('channels', channel.id)
          .subscribe((messages: Message[]) => {
            this.allMessages.push(...messages);
          });
      }
    });
  }

  getAllChatMessages() {
    this.firebaseService.getChats().subscribe((chats: Chat[]) => {
      const allChats = chats;
      for (const chat of allChats) {
        this.firebaseService
          .getMessages('directMessages', chat.id)
          .subscribe((messages: Message[]) => {
            this.allMessages.push(...messages);
          });
      }
    });
  }
}
