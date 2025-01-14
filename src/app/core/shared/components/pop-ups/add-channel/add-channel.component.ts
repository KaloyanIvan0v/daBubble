import { Channel } from 'src/app/core/shared/models/channel.class';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { MainService } from '../../../services/main-service/main.service';
import { first, pipe } from 'rxjs';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss'],
})
export class AddChannelComponent {
  @Input() popUpOpen: boolean = true;

  channelName: string = '';
  chanelDescription: string = '';
  channelNameExists: boolean = false;

  /**
   * Constructs the AddChannelComponent with necessary service dependencies.
   * @param firebaseService Service for interacting with Firebase.
   * @param authService Service for authentication and user information.
   * @param workspaceService Service for managing workspace-related data.
   */
  constructor(
    public firebaseService: FirebaseServicesService,
    public authService: AuthService,
    public workspaceService: WorkspaceService,
    public mainService: MainService
  ) {}

  /**
   * Closes the add channel popup by updating the workspace service state.
   * This method is typically called when the user decides to cancel adding a new channel.
   */
  closePopUp() {
    this.workspaceService.addChannelPopUp.set(false);
  }

  /**
   * Clears the input fields for channel name and description.
   * This method is useful after successfully creating a channel or when resetting the form.
   */
  clearForm() {
    this.channelName = '';
    this.chanelDescription = '';
  }

  /**
   * Creates a new channel with the provided name and description.
   * This method performs the following steps:
   * 1. Retrieves the current user's UID.
   * 2. Generates a unique ID for the new channel.
   * 3. Constructs a new `Channel` object with the necessary details.
   * 4. Adds the new channel to the Firebase Firestore.
   * 5. Clears the form and closes the popup upon successful creation.
   */
  async createChannel() {
    const uid = await this.authService.getCurrentUserUID();

    const channelId = this.firebaseService.getUniqueId();

    const newChannel: Channel = {
      uid: [uid ?? ''],
      id: channelId,
      name: this.channelName.trim(),
      description: this.chanelDescription.trim(),
      creator: uid ?? '',
    };

    this.firebaseService.addDoc('channels', newChannel);
    this.clearForm();
    this.closePopUp();
  }

  /**
   * Getter to determine the visibility of the add channel popup.
   * It retrieves the current state from the workspace service.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible() {
    return this.workspaceService.addChannelPopUp();
  }

  checkIfChannelNameExists() {
    this.mainService
      .channelExists(this.channelName)
      .pipe(first())
      .subscribe((exists) => {
        this.channelNameExists = exists;
      });
  }

  nameIsValid() {
    return this.channelName.trim().length > 0;
  }
}
