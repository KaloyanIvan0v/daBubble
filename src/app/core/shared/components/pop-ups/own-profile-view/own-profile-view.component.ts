import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-own-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './own-profile-view.component.html',
  styleUrls: ['./own-profile-view.component.scss'],
})
export class OwnProfileViewComponent {
  /**
   * Observable containing the logged-in user's data.
   */
  userData$: Observable<any>;

  /**
   * Constructs the OwnProfileViewComponent.
   * @param workspaceService - Service managing workspace-related states and data.
   */
  constructor(public workspaceService: WorkspaceService) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  /**
   * Closes the own profile view popup by updating the workspace service state.
   */
  closePopUp(): void {
    this.workspaceService.ownProfileViewPopUp.set(false);
  }

  /**
   * Closes the edit avatar popup by updating the workspace service state.
   */
  closeEditImgPopUp(): void {
    this.workspaceService.editAvatarPopUp.set(false);
  }

  /**
   * Opens the edit avatar popup by updating the workspace service state.
   */
  openEditImgPopUp(): void {
    this.workspaceService.editAvatarPopUp.set(true);
  }

  /**
   * Opens the edit profile popup by closing the current popup and updating the workspace service state.
   */
  openEditProfilePopUp(): void {
    this.closePopUp();
    this.workspaceService.ownProfileEditPopUp.set(true);
  }

  /**
   * Retrieves the visibility state of the own profile view popup.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible(): boolean {
    return this.workspaceService.ownProfileViewPopUp();
  }
}
