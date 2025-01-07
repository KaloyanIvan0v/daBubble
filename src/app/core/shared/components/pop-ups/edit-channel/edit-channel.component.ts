import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Observable, Subject } from 'rxjs';
import { User } from 'src/app/core/shared/models/user.class';
import { Router } from '@angular/router';
import { takeUntil, first } from 'rxjs/operators';
import { UserListComponent } from '../../user-list/user-list.component';

@Component({
  selector: 'app-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, UserListComponent],
  templateUrl: './edit-channel.component.html',
  styleUrls: ['./edit-channel.component.scss'],
})
export class EditChannelComponent implements OnDestroy {
  channelData$!: Observable<Channel>;
  channelData!: Channel;
  currentChannelId: string = '';
  channelCreator$!: Observable<User>;
  private destroy$ = new Subject<void>();

  editNameActive: boolean = false;
  editDescriptionActive: boolean = false;

  /**
   * Constructs the EditChannelComponent with necessary service dependencies.
   * Initializes the channel data.
   * @param workspaceService Service for managing workspace-related data.
   * @param firebaseService Service for interacting with Firebase.
   * @param authService Service for authentication and user information.
   * @param router Router service for navigation.
   */
  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    public authService: AuthService,
    private router: Router
  ) {
    this.initializeChannelData();
  }

  /**
   * Initializes the channel data by setting up reactive effects and subscriptions.
   * This method sets up an effect to monitor changes in the active channel and subscribes to channel data updates.
   */
  private initializeChannelData() {
    effect(() => {
      this.currentChannelId = this.workspaceService.currentActiveUnitId();
      this.channelData$ = this.firebaseService.getChannel(
        this.currentChannelId
      );
      this.setInputValues();
      this.subscribeToChannelData();
    });
  }

  /**
   * Subscribes to the channel data observable to receive updates about the current channel.
   * It ensures that the subscription is terminated when the component is destroyed.
   */
  private subscribeToChannelData() {
    this.channelData$
      .pipe(
        first((channelData) => channelData !== null),
        takeUntil(this.destroy$)
      )
      .subscribe((channelData: Channel) => {
        this.setChannelCreator(channelData.creator);
      });
  }

  /**
   * Sets the creator of the channel by fetching the creator's user data from Firebase.
   * @param creatorUid The UID of the channel creator.
   */
  async setChannelCreator(creatorUid: string) {
    const currentUserUid = await this.authService.getCurrentUserUID();
    if (currentUserUid) {
      this.channelCreator$ = this.firebaseService.getUser(creatorUid);
    }
  }

  /**
   * Sets the input values for the channel data by subscribing to the channel data observable.
   * This method updates the local `channelData` property with the latest channel information.
   */
  setInputValues() {
    this.channelData$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.channelData = data;
    });
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Cleans up all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggles the edit mode for the channel name.
   * If the edit mode is active, it will be deactivated, and vice versa.
   */
  toggleEditName() {
    this.editNameActive = !this.editNameActive;
  }

  /**
   * Toggles the edit mode for the channel description.
   * If the edit mode is active, it will be deactivated, and vice versa.
   */
  toggleEditDescription() {
    this.editDescriptionActive = !this.editDescriptionActive;
  }

  /**
   * Closes the edit channel popup by updating the workspace service state.
   * This method is typically called when the user decides to cancel editing the channel.
   */
  closeEditChannelPopUp() {
    this.workspaceService.editChannelPopUp.set(false);
  }

  /**
   * Saves the changes made to the channel's data.
   * This method updates the channel document in Firebase with the current `channelData`.
   */
  saveChanges() {
    this.firebaseService.updateDoc<Channel>(
      'channels',
      this.currentChannelId,
      this.channelData
    );
  }

  /**
   * Allows the current user to leave the channel.
   * This method performs the following steps:
   * 1. Removes the current user's UID from the channel's user list.
   * 2. Saves the updated channel data to Firebase.
   * 3. Closes the edit channel popup.
   * 4. Navigates the user to the "new-chat" route.
   */
  async leaveChannel() {
    await this.removeCurrentUserFromChannel();
    this.saveChanges();
    this.closeEditChannelPopUp();
    this.navigateToNewChat();
  }

  /**
   * Removes the current user's UID from the channel's user list.
   * This method ensures that the channel's user list is updated to exclude the current user.
   */
  private async removeCurrentUserFromChannel() {
    const currentLoggedInUserUid = await this.authService.getCurrentUserUID();
    this.channelData.uid = this.channelData.uid.filter(
      (uid) => uid !== currentLoggedInUserUid
    );
  }

  /**
   * Navigates the user to the "new-chat" route.
   * This is typically called after the user leaves a channel to redirect them to a different view.
   */
  navigateToNewChat() {
    this.router.navigate(['dashboard', 'new-chat']);
  }

  /**
   * Getter to determine the visibility of the edit channel popup.
   * Retrieves the current state from the workspace service.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible() {
    return this.workspaceService.editChannelPopUp();
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
   * This method sets the state in the workspace service to display the add user popup.
   */
  openAddUserToChannelPopUp() {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }
}
