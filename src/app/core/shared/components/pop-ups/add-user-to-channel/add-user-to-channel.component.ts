import {
  Component,
  Renderer2,
  ViewChildren,
  QueryList,
  ElementRef,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { User } from 'src/app/core/shared/models/user.class';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-user-to-channel.component.html',
  styleUrls: ['./add-user-to-channel.component.scss'],
})
export class AddUserToChannelComponent implements OnDestroy {
  currentChannelId: string;
  channelData$!: Observable<Channel>;
  channelData!: Channel;
  searchText: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = [];
  private destroy$ = new Subject<void>();

  /**
   * Constructs the AddUserToChannelComponent with necessary service dependencies.
   * @param workspaceService Service for managing workspace-related data.
   * @param firebaseService Service for interacting with Firebase.
   * @param renderer Renderer2 for manipulating DOM elements.
   */
  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private renderer: Renderer2
  ) {
    this.currentChannelId = this.workspaceService.currentActiveUnitId();
    this.initializeUsers();
    this.initializeChannelData();
  }

  /**
   * Initializes the list of users by fetching them from Firebase.
   * Subscribes to the users observable and updates the local users array.
   */
  private initializeUsers() {
    this.firebaseService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
      });
  }

  /**
   * Initializes the channel data by fetching the current channel's information from Firebase.
   * Utilizes the `effect` to reactively update channel data when the active channel changes.
   */
  private initializeChannelData() {
    effect(() => {
      this.currentChannelId = this.workspaceService.currentActiveUnitId();
      this.channelData$ = this.firebaseService.getChannel(
        this.currentChannelId
      );
      this.channelData$.pipe(takeUntil(this.destroy$)).subscribe((channel) => {
        this.channelData = channel;
      });
    });
  }

  @ViewChildren('userChip') userChips!: QueryList<ElementRef>;

  /**
   * Getter to determine the visibility of the add user to channel popup.
   * Retrieves the current state from the workspace service.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible() {
    return this.workspaceService.addUserToChannelPopUp();
  }

  /**
   * Closes the add user to channel popup by updating the workspace service state.
   * This method is typically called when the user decides to cancel adding users.
   */
  closePopUp() {
    this.workspaceService.addUserToChannelPopUp.set(false);
  }

  /**
   * Adds the selected users to the current channel.
   * This method performs the following steps:
   * 1. Closes the popup.
   * 2. Retrieves the UIDs of the selected users.
   * 3. Updates the channel's user IDs with the new UIDs.
   * 4. Clears the list of selected users.
   */
  addUsers() {
    this.closePopUp();
    const newUids = this.getSelectedUserUids();
    this.updateChannelUserIds(newUids);
    this.clearSelectedUsers();
  }

  /**
   * Retrieves the UIDs of the currently selected users.
   * @returns An array of user UIDs.
   */
  private getSelectedUserUids(): string[] {
    return this.selectedUsers.map((user) => user.uid);
  }

  /**
   * Updates the channel's user IDs by adding new UIDs.
   * Ensures that there are no duplicate UIDs in the channel's user list.
   * @param newUids An array of new user UIDs to be added to the channel.
   */
  private updateChannelUserIds(newUids: string[]) {
    this.channelData.uid = [...new Set([...this.channelData.uid, ...newUids])];
    this.firebaseService.updateDoc('channels', this.currentChannelId, {
      uid: this.channelData.uid,
    });
  }

  /**
   * Clears the list of selected users.
   * This method is useful after successfully adding users to the channel.
   */
  private clearSelectedUsers() {
    this.selectedUsers = [];
  }

  /**
   * Adds a user chip to the selected users list.
   * If the user is already selected, it triggers an animation to indicate duplication.
   * @param user The user to be added as a chip.
   */
  addUserChip(user: User) {
    if (!this.isUserAlreadySelected(user)) {
      this.addUserToSelected(user);
    } else {
      this.animateExistingUserChip(user);
    }
  }

  /**
   * Checks if a user is already selected.
   * @param user The user to check for selection.
   * @returns True if the user is already selected; otherwise, false.
   */
  private isUserAlreadySelected(user: User): boolean {
    return this.selectedUsers.some(
      (existingUser) => existingUser.uid === user.uid
    );
  }

  /**
   * Adds a user to the list of selected users.
   * Resets the search text after adding.
   * @param user The user to be added to the selected users list.
   */
  private addUserToSelected(user: User) {
    this.selectedUsers.push(user);
    this.searchText = '';
  }

  /**
   * Animates the user chip if the user is already selected.
   * Adds a shake animation to indicate that the user is already selected.
   * @param user The user whose chip needs to be animated.
   */
  private animateExistingUserChip(user: User) {
    const userChip = this.findUserChipById(user.uid);
    if (userChip) {
      this.renderer.addClass(userChip.nativeElement, 'shake-div');
      setTimeout(() => {
        this.renderer.removeClass(userChip.nativeElement, 'shake-div');
      }, 300);
    }
  }

  /**
   * Finds the user chip element by the user's UID.
   * @param uid The UID of the user whose chip is to be found.
   * @returns The ElementRef of the user chip if found; otherwise, undefined.
   */
  private findUserChipById(uid: string): ElementRef | undefined {
    return this.userChips.find((chip) => chip.nativeElement.id === uid);
  }

  /**
   * Removes a user chip from the selected users list.
   * @param user The user whose chip is to be removed.
   */
  removeUserChip(user: User) {
    const index = this.selectedUsers.indexOf(user);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  /**
   * Filters the list of users based on the search text.
   * Excludes users who are already part of the current channel.
   */
  filterUsers() {
    this.filteredUsers = this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(this.searchText.toLowerCase()) &&
        !this.channelData.uid.includes(user.uid)
    );
  }

  /**
   * Handler for changes in the search text input.
   * Triggers the filtering of users based on the updated search text.
   */
  onSearchTextChange() {
    this.filterUsers();
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Cleans up subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
