import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
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
export class SearchInputComponent implements OnInit, OnDestroy {
  allMessages: Message[] = [];
  filteredMessages: Message[] = [];

  // Array zum Speichern unserer Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public firebaseService: FirebaseServicesService,
    public searchService: SearchService,
    private router: Router,
    public workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.getAllMessages();
  }

  /**
   * Sucht Nachrichten, in denen der eingegebene Text vorkommt.
   */
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
    const messageId = message.id; // Eindeutige Nachricht-ID

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
    return messagePath ? messagePath.split('/')[1] === 'channels' : false;
  }

  isMobile(): boolean {
    return window.innerWidth < 960;
  }

  /**
   * Lädt alle Nachrichten aus allen Channels und Chats.
   */
  getAllMessages() {
    this.allMessages = [];
    this.getAllChatMessages();
    this.getAllChannelMessages();
  }

  /**
   * Ruft alle Channel-Nachrichten ab und merged sie in allMessages.
   */
  getAllChannelMessages() {
    // 1. Channels abonnieren
    const channelSub = this.firebaseService
      .getChannels()
      .subscribe((channels: Channel[]) => {
        // 2. Für jeden Channel dessen Nachrichten abonnieren
        channels.forEach((channel) => {
          const msgSub = this.firebaseService
            .getMessages('channels', channel.id)
            .subscribe((messages: Message[]) => {
              this.allMessages.push(...messages);
            });

          // msgSub mit tracken
          this.subscriptions.push(msgSub);
        });
      });

    // channelSub mit tracken
    this.subscriptions.push(channelSub);
  }

  /**
   * Ruft alle Direkt-Chat-Nachrichten ab und merged sie in allMessages.
   */
  getAllChatMessages() {
    // 1. Chats abonnieren
    const chatSub = this.firebaseService
      .getChats()
      .subscribe((chats: Chat[]) => {
        // 2. Für jeden Chat dessen Nachrichten abonnieren
        chats.forEach((chat) => {
          const msgSub = this.firebaseService
            .getMessages('directMessages', chat.id)
            .subscribe((messages: Message[]) => {
              this.allMessages.push(...messages);
            });

          // msgSub mit tracken
          this.subscriptions.push(msgSub);
        });
      });

    // chatSub mit tracken
    this.subscriptions.push(chatSub);
  }

  /**
   * Angular-Hook, der aufgerufen wird, wenn die Komponente zerstört wird.
   * Hier unsubscriben wir von allen Subscriptions, um Speicherlecks zu vermeiden.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
