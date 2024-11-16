import { Component, Input } from '@angular/core';
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
  userData$: Observable<any>;

  constructor(public workspaceService: WorkspaceService) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  closePopUp() {
    this.workspaceService.ownProfileViewPopUp.set(false);
  }

  closeEditImgPopUp() {
    this.workspaceService.editAvatarPopUp.set(false);
  }

  openEditImgPopUp() {
    this.workspaceService.editAvatarPopUp.set(true);
  }

  openEditProfilePopUp() {
    this.closePopUp();
    this.workspaceService.ownProfileEditPopUp.set(true);
  }

  get popUpVisible() {
    return this.workspaceService.ownProfileViewPopUp();
  }
}
