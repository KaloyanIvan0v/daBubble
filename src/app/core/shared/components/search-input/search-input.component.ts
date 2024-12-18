import { Component, OnInit } from '@angular/core';
import { SearchService } from 'src/app/core/shared/services/search-service/search.service';
import { CommonModule } from '@angular/common';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Chat } from 'src/app/core/shared/models/chat.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { ShowUserPipe } from 'src/app/shared/pipes/show-user.pipe';
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
    public searchService: SearchService
  ) {}

  ngOnInit() {
    this.getAllMessages();
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const inputText = input.value.toLowerCase();
    if (inputText !== '') {
      this.filteredMessages = this.allMessages.filter((message) => {
        const messageText = message.value.text.toLowerCase();
        return messageText.includes(inputText);
      });
    } else {
      this.filteredMessages = [];
    }
  }

  openMessage(message: Message) {
    console.log(message);
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
