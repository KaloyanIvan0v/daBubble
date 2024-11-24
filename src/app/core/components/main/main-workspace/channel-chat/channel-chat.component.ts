import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  effect,
  NgZone,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Observable, Subscription } from 'rxjs';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { AddUserToChannelComponent } from 'src/app/core/shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { ChannelMembersViewComponent } from 'src/app/core/shared/components/pop-ups/channel-members-view/channel-members-view.component';
import { EditChannelComponent } from 'src/app/core/shared/components/pop-ups/edit-channel/edit-channel.component';
import { MessageComponent } from 'src/app/core/shared/components/message/message.component';

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
  messagePath = '/channels/' + this.channelId + '/messages';

  messages$!: Observable<Message[]>;
  private messages: Message[] = [];
  messageToEdit: Message | null = null;

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    private ngZone: NgZone
  ) {
    effect(() => {
      this.channelId = this.workspaceService.currentActiveUnitId();
      if (this.channelId) {
        this.loadChannelData(this.channelId);
        this.messagePath = '/channels/' + this.channelId + '/messages';
      } else {
        console.warn('Keine gültige channelId verfügbar.');
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
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();

    this.channelUsers = [];

    this.channelSubscription = this.firebaseService
      .getChannel(channelId)
      .subscribe({
        next: (channel) => {
          if (channel) {
            this.channelData = channel;
            this.channelName = channel.name;
            this.userAmount = channel.uid.length;
            this.loadUsers();
          }
        },
        error: (error) =>
          console.error('Fehler beim Laden des Channels:', error),
      });

    this.messages$ = this.firebaseService.getMessages('channels', channelId);

    this.messagesSubscription = this.messages$.subscribe((messages) => {
      if (messages) {
        this.messages = messages;
        setTimeout(() => {
          // to ensure messages are rendered before scrolling
          this.checkForNewMessages();
        });
      }
    });
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
}
