import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { UserListComponent } from '../../user-list/user-list.component';
import { User } from 'src/app/core/shared/models/user.class';

@Component({
  selector: 'app-channel-members-view',
  standalone: true,
  imports: [CommonModule, UserListComponent],
  templateUrl: './channel-members-view.component.html',
  styleUrls: ['./channel-members-view.component.scss'],
})
export class ChannelMembersViewComponent implements OnDestroy {
  channelData!: Channel;
  channelUsers$ = new BehaviorSubject<any[]>([]);
  channelUsersUid: string[] = [];

  currentUserUid: string | null = null;
  private subscriptions: Subscription[] = [];

  /**
   * Constructs the ChannelMembersViewComponent with necessary service dependencies.
   * Initializes the current user UID and channel data.
   * @param firebaseService Service for interacting with Firebase.
   * @param workspaceService Service for managing workspace-related data.
   * @param AuthService Service for authentication and user information.
   */
  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public AuthService: AuthService
  ) {
    this.setLoggedInUserUid();
    this.initializeChannelEffect();
  }

  /**
   * Handles the event when a user is selected from the user list.
   * Opens the profile view for the selected user.
   * @param $event The user that was selected.
   */
  onUserSelected($event: User) {
    this.openProfileView($event.uid);
  }

  /**
   * Initializes the reactive effect to listen for changes in the current channel.
   * Sets up the subscription to update channel data when the active channel changes.
   */
  private initializeChannelEffect() {
    effect(this.channelEffectCallback.bind(this));
  }

  /**
   * Callback function for the channel effect.
   * Unsubscribes from previous channel subscriptions, retrieves the current channel ID,
   * and subscribes to updates for the current channel.
   */
  private async channelEffectCallback() {
    this.unsubscribeAll();
    const unitId = this.workspaceService.currentActiveUnitId();
    const channelSub = this.firebaseService
      .getChannel(unitId)
      .subscribe(this.channelSubscriptionCallback.bind(this));
    this.subscriptions.push(channelSub);
  }

  /**
   * Callback function for channel data subscription.
   * Updates the local channel data with the latest information from Firebase.
   * @param channel The updated channel data received from Firebase.
   */
  private async channelSubscriptionCallback(channel: Channel) {
    this.channelData = channel;
  }

  /**
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   * This method is called before setting up new subscriptions and when the component is destroyed.
   */
  private unsubscribeAll() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Retrieves and sets the UID of the currently logged-in user.
   * This method is called during component initialization.
   */
  async setLoggedInUserUid() {
    this.currentUserUid = await this.AuthService.getCurrentUserUID();
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Cleans up all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Closes the channel members popup by updating the workspace service state.
   * This method is typically called when the user decides to close the popup.
   */
  closePopUp() {
    this.workspaceService.channelMembersPopUp.set(false);
  }

  /**
   * Opens the profile view for a specific user.
   * Sets the active user ID in the workspace service and triggers the profile view popup.
   * @param uid The UID of the user whose profile is to be viewed.
   */
  openProfileView(uid: string) {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  /**
   * Opens the popup to add users to the current channel.
   * Closes the channel members popup and opens the add user to channel popup.
   */
  openAddUserToChannelPopUp() {
    this.closePopUp();
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  /**
   * Getter to determine the visibility of the channel members popup.
   * Retrieves the current state from the workspace service.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible() {
    return this.workspaceService.channelMembersPopUp();
  }
}
