import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Observable, Subscription } from 'rxjs';
import { AddUserToChannelComponent } from 'src/app/core/shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { ChannelMembersViewComponent } from 'src/app/core/shared/components/pop-ups/channel-members-view/channel-members-view.component';
import { EditChannelComponent } from 'src/app/core/shared/components/pop-ups/edit-channel/edit-channel.component';
import { MessageComponent } from 'src/app/core/shared/components/message/message.component';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { Timestamp } from '@angular/fire/firestore';
import { FirebaseDatePipe } from 'src/app/shared/pipes/firebase-date.pipe';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';
@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [
    InputBoxComponent,
    AddUserToChannelComponent,
    ChannelMembersViewComponent,
    EditChannelComponent,
    FormsModule,
    CommonModule,
    MessageComponent,
    FirebaseDatePipe,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss'],
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private channelSubscription?: Subscription;
  private messagesSubscription?: Subscription;

  channelData!: Channel;
  channelName: string = '';
  channelId: string = '';
  userAmount: number = 0;
  channelUsers: any[] = [];
  popUpStates: { [key: string]: boolean } = {};

  private lastMessageLength: number = 0;
  private popUpStatesSubscription?: Subscription;
  messages$!: Observable<Message[]>;
  private messages: Message[] = [];
  lastRenderedMessage: Message | null = null;
  messageToEdit: Message | null = null;

  get messagePath(): string {
    return `/channels/${this.channelId}/messages`;
  }

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService
  ) {
    effect(() => {
      this.channelId = this.workspaceService.currentActiveUnitId();
      if (this.channelId) {
        this.loadChannelData(this.channelId);
      } else {
        console.warn('No valid channelId available.');
      }
    });
  }

  ngOnInit(): void {}

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    }
  }

  private checkForNewMessages(): void {
    if (this.lastMessageLength !== this.messages.length) {
      this.scrollToBottom();
      this.lastMessageLength = this.messages.length;
    }
  }

  loadChannelData(channelId: string): void {
    this.unsubscribeFromPrevious();
    this.resetChannelData();
    this.subscribeToChannel(channelId);
    this.subscribeToMessages(channelId);
  }

  private unsubscribeFromPrevious(): void {
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
  }

  private resetChannelData(): void {
    this.channelUsers = [];
  }

  private subscribeToChannel(channelId: string): void {
    this.channelSubscription = this.firebaseService
      .getChannel(channelId)
      .subscribe({
        next: (channel) => this.handleChannelData(channel),
        error: (error) =>
          console.error('Fehler beim Laden des Channels:', error),
      });
  }

  private handleChannelData(channel: Channel): void {
    if (channel) {
      this.channelData = channel;
      this.channelName = channel.name;
      this.userAmount = channel.uid.length;
      this.loadUsers();
    }
  }

  private subscribeToMessages(channelId: string): void {
    this.messages$ = this.firebaseService.getMessages('channels', channelId);
    this.messagesSubscription = this.messages$.subscribe((messages) =>
      this.handleMessages(messages)
    );
  }

  private handleMessages(messages: Message[]): void {
    if (messages) {
      this.messages = messages;
      setTimeout(() => {
        // to ensure messages are rendered before scrolling
        this.checkForNewMessages();
      });
    }
  }

  async loadUsers() {
    const channelUids = this.channelData.uid;
    const userPromises = channelUids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = await Promise.all(userPromises);
    this.channelUsers = users.filter((user) => user != null);
  }

  ngOnDestroy(): void {
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
    this.popUpStatesSubscription?.unsubscribe();
  }

  openEditChannelPopUp() {
    this.workspaceService.editChannelPopUp.set(true);
  }

  openAddUserToChannelPopUp() {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  openChannelUsersViewPopUp() {
    this.workspaceService.channelMembersPopUp.set(true);
  }

  isNewDay(prevTimestamp?: number, currentTimestamp?: number): boolean {
    if (!prevTimestamp || !currentTimestamp) return false;
    const prevDate = new Date(prevTimestamp);
    const currentDate = new Date(currentTimestamp);
    return !this.isSameDay(prevDate, currentDate);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  getTimestamp(time: Timestamp | Date | number): number | undefined {
    if (time instanceof Timestamp) {
      time = time.toDate();
    } else if (typeof time === 'number') {
      time = new Date(time);
    }
    return time instanceof Date ? time.getTime() : undefined;
  }
}
