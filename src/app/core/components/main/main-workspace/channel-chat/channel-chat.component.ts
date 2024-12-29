import { Component, OnDestroy, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Observable, Subscription } from 'rxjs';
import { AddUserToChannelComponent } from 'src/app/core/shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { ChannelMembersViewComponent } from 'src/app/core/shared/components/pop-ups/channel-members-view/channel-members-view.component';
import { EditChannelComponent } from 'src/app/core/shared/components/pop-ups/edit-channel/edit-channel.component';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { ChatComponent } from 'src/app/core/shared/components/chat/chat.component';

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
    ChatComponent,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss'],
})
export class ChannelChatComponent implements OnDestroy {
  private subscriptions = new Subscription();
  private channelSubscription?: Subscription;
  private messagesSubscription?: Subscription;

  channelData!: Channel;
  channelName: string = '';
  channelId: string = '';
  userAmount: number = 0;
  channelUsers: any[] = [];
  usersUid: string[] = [];
  popUpStates: { [key: string]: boolean } = {};

  private popUpStatesSubscription?: Subscription;
  messages$!: Observable<Message[]>;
  messages: Message[] = [];
  lastRenderedMessage: Message | null = null;
  messageToEdit: Message | undefined = undefined;

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
        this.workspaceService.setActiveChannelId(this.channelId);
        this.loadChannelData(this.channelId);
      } else {
        console.warn('No valid channelId available.');
      }
    });
  }

  messageToEditHandler($event: Message): void {
    this.messageToEdit = $event;
  }

  private subscribeToMessages(channelId: string): void {
    this.messages$ = this.firebaseService.getMessages('channels', channelId);
    this.messagesSubscription = this.messages$.subscribe((messages) => {
      this.messages = messages;
    });
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

  async loadUsers() {
    const channelUids = this.channelData.uid;
    this.setUserUids(channelUids);
    const userPromises = channelUids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = await Promise.all(userPromises);
    this.channelUsers = users.filter((user) => user != null);
  }

  setUserUids(uids: string[]) {
    this.usersUid = uids;
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
