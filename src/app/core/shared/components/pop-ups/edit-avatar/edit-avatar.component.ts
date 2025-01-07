import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { UploadCareService } from '../../../services/uploadcare-service/uploadcare.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-services/auth.service';

@Component({
  selector: 'app-edit-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-avatar.component.html',
  styleUrls: ['./edit-avatar.component.scss'],
})
export class EditAvatarComponent {
  userData$: Observable<any>;

  /**
   * Constructs the EditAvatarComponent with necessary service dependencies.
   * Initializes the observable for user data.
   * @param workspaceService Service for managing workspace-related data.
   * @param uploadCareService Service for handling avatar uploads.
   * @param authService Service for authentication and user information.
   */
  constructor(
    public workspaceService: WorkspaceService,
    public uploadCareService: UploadCareService,
    public authService: AuthService
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  /**
   * Handles the event when a new photo is selected for the avatar.
   * Closes the avatar editing popup and triggers the avatar upload process.
   * @param event The file input event containing the selected file.
   */
  updatePhoto(event: any) {
    this.workspaceService.editAvatarPopUp.set(false);
    this.uploadCareService.saveAvatar();
  }

  /**
   * Closes the avatar editing popup by updating the workspace service state.
   * This method is typically called when the user decides to cancel editing the avatar.
   */
  closePopUp() {
    this.workspaceService.editAvatarPopUp.set(false);
  }

  /**
   * Getter to determine the visibility of the edit avatar popup.
   * Retrieves the current state from the workspace service.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible() {
    return this.workspaceService.editAvatarPopUp();
  }
}
