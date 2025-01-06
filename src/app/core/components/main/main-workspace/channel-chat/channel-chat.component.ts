import { Component, HostListener, OnDestroy, effect } from '@angular/core';
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
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';

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

  /**
   * Constructs a new ChannelChatComponent.
   * @param workspaceService The service which manages the workspace state.
   * @param firebaseService The service which handles the Firebase operations.
   * @param statefulWindowService The service which handles the pop-up states.
   */
  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    public statefulWindowService: StatefulWindowServiceService
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

  ngOnInit(): void {
    this.statefulWindowService.updateView(window.innerWidth);
  }

  @HostListener('window:resize', ['$event'])
  /**
   * Handles the window resize event and updates the pop-up states based on the new window width.
   * @param event The event object of the window resize event.
   */
  onResize(event: any): void {
    this.statefulWindowService.updateView(event.target.innerWidth);
  }

  messageToEditHandler($event: Message): void {
    this.messageToEdit = $event;
  }

  /**
   * Subscribes to the message stream for a specific channel and updates the messages list.
   * @param channelId The ID of the channel for which to subscribe to messages.
   */

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

  /**
   * Subscribes to the channel data stream for a specific channel and updates the channel data.
   * Logs an error message if there is an issue loading the channel.
   * @param channelId The ID of the channel to subscribe to.
   */

  private subscribeToChannel(channelId: string): void {
    this.channelSubscription = this.firebaseService
      .getChannel(channelId)
      .subscribe({
        next: (channel) => this.handleChannelData(channel),
        error: (error) =>
          console.error('Fehler beim Laden des Channels:', error),
      });
  }

  /**
   * Handles the channel data by updating the relevant component properties.
   * Sets the channel data, name, and user amount, then loads the users of the channel.
   * @param channel The channel data to be handled.
   */

  private handleChannelData(channel: Channel): void {
    if (channel) {
      this.channelData = channel;
      this.channelName = channel.name;
      this.userAmount = channel.uid.length;
      this.loadUsers();
    }
  }

  /**
   * Loads the users of the channel and updates the channel users list.
   * Fetches the user documents from the database, filters out any null values, and
   * assigns the result to the channelUsers property.
   */
  async loadUsers() {
    const channelUids = this.channelData.uid;
    this.setUserUids(channelUids);
    const userPromises = channelUids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = await Promise.all(userPromises);
    this.channelUsers = users.filter((user) => user != null);
  }

  /**
   * Sets the usersUid property to the given uids array.
   * The usersUid property is used by the user-list component to determine which users to display.
   * @param uids The array of user IDs to set as the usersUid property value.
   */
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

  /**
   * Opens the add user to channel pop-up, based on the window size.
   * If the window is below 960px, opens the channel members view pop-up instead.
   */
  openAddUserToChannelPopUp() {
    if (this.statefulWindowService.isBelow960) {
      this.workspaceService.channelMembersPopUp.set(true);
    } else {
      this.workspaceService.addUserToChannelPopUp.set(true);
    }
  }

  openChannelUsersViewPopUp() {
    this.workspaceService.channelMembersPopUp.set(true);
  }
}
