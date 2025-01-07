import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';
import { AddUserToChannelComponent } from 'src/app/core/shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { ChannelMembersViewComponent } from 'src/app/core/shared/components/pop-ups/channel-members-view/channel-members-view.component';
import { EditChannelComponent } from 'src/app/core/shared/components/pop-ups/edit-channel/edit-channel.component';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { ChatComponent } from 'src/app/core/shared/components/chat/chat.component';

import { Subscription, Observable } from 'rxjs';
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
    ChatComponent,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss'],
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private channelSubscription?: Subscription;
  private messagesSubscription?: Subscription;
  private popUpStatesSubscription?: Subscription;

  public channelData!: Channel;
  public channelName: string = '';
  public channelId: string = '';
  public userAmount: number = 0;
  public channelUsers: any[] = [];
  public usersUid: string[] = [];
  public popUpStates: { [key: string]: boolean } = {};
  public messages$!: Observable<Message[]>;
  public messages: Message[] = [];
  public lastRenderedMessage: Message | null = null;
  public messageToEdit: Message | undefined = undefined;

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    public statefulWindowService: StatefulWindowServiceService
  ) {
    effect(() => this.handleChannelEffect());
  }

  /**
   * Called after the component's data-bound properties have been initialized.
   */
  ngOnInit(): void {
    this.statefulWindowService.updateView(window.innerWidth);
  }

  /**
   * Called once the component is about to be destroyed; unsubscribes from active subscriptions.
   */
  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  /**
   * Handles window resize events to update pop-up states.
   * @param event Window resize event.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.statefulWindowService.updateView(event.target.innerWidth);
  }

  /**
   * Reacts to changes in the active channel ID and triggers loading of channel data.
   */
  private handleChannelEffect(): void {
    this.channelId = this.workspaceService.currentActiveUnitId();
    if (this.channelId) {
      this.workspaceService.setActiveChannelId(this.channelId);
      this.loadChannelData(this.channelId);
    } else {
      console.warn('No valid channelId available.');
    }
  }

  /**
   * Loads channel data and messages by unsubscribing from previous subscriptions and resetting local data.
   * @param channelId The channel ID to load data for.
   */
  public loadChannelData(channelId: string): void {
    this.unsubscribeFromPrevious();
    this.resetChannelData();
    this.subscribeToChannel(channelId);
    this.subscribeToMessages(channelId);
  }

  /**
   * Subscribes to channel data using the provided channel ID.
   * @param channelId The ID of the channel.
   */
  private subscribeToChannel(channelId: string): void {
    this.channelSubscription = this.firebaseService
      .getChannel(channelId)
      .subscribe({
        next: (channel) => this.handleChannelData(channel),
        error: (error) => console.error('Error loading the channel:', error),
      });
  }

  /**
   * Handles incoming channel data and updates component properties accordingly.
   * @param channel The retrieved channel data.
   */
  private handleChannelData(channel: Channel | null): void {
    if (!channel) return;
    this.channelData = channel;
    this.channelName = channel.name;
    this.userAmount = channel.uid.length;
    this.loadUsers();
  }

  /**
   * Loads and stores the users belonging to the current channel.
   */
  private async loadUsers(): Promise<void> {
    const channelUids = this.channelData.uid;
    this.setUserUids(channelUids);
    const userPromises = channelUids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = (await Promise.all(userPromises)).filter(Boolean);
    this.channelUsers = users;
  }

  /**
   * Stores the provided user UIDs for rendering in other components.
   * @param uids Array of user UIDs.
   */
  public setUserUids(uids: string[]): void {
    this.usersUid = uids;
  }

  /**
   * Resets channel data such as user and message arrays.
   */
  private resetChannelData(): void {
    this.channelUsers = [];
    this.messages = [];
  }

  /**
   * Subscribes to the message stream for the specified channel.
   * @param channelId The ID of the channel.
   */
  private subscribeToMessages(channelId: string): void {
    this.messages$ = this.firebaseService.getMessages('channels', channelId);
    this.messagesSubscription = this.messages$.subscribe(
      (messages: Message[]) => {
        this.messages = messages;
      }
    );
  }

  /**
   * Sets a message to be edited.
   * @param message The message to edit.
   */
  public messageToEditHandler(message: Message): void {
    this.messageToEdit = message;
  }

  /**
   * Opens the pop-up for editing channel details.
   */
  public openEditChannelPopUp(): void {
    this.workspaceService.editChannelPopUp.set(true);
  }

  /**
   * Opens the pop-up for adding a user to the channel;
   * if the viewport is narrow, opens the channel members view instead.
   */
  public openAddUserToChannelPopUp(): void {
    if (this.statefulWindowService.isBelow960) {
      this.workspaceService.channelMembersPopUp.set(true);
    } else {
      this.workspaceService.addUserToChannelPopUp.set(true);
    }
  }

  /**
   * Opens the pop-up displaying the channel's user list.
   */
  public openChannelUsersViewPopUp(): void {
    this.workspaceService.channelMembersPopUp.set(true);
  }

  /**
   * Unsubscribes from channel and message subscriptions.
   */
  private unsubscribeFromPrevious(): void {
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
  }

  /**
   * Unsubscribes from all active subscriptions, called when the component is destroyed.
   */
  private unsubscribeAll(): void {
    this.unsubscribeFromPrevious();
    this.subscriptions.unsubscribe();
    this.popUpStatesSubscription?.unsubscribe();
  }

  /**
   * Returns the Firestore path for messages within the current channel.
   */
  public get messagePath(): string {
    return `/channels/${this.channelId}/messages`;
  }
}
