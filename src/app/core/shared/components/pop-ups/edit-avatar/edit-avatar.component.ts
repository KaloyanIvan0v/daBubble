import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { UploadCareService } from '../../../services/uploadcare-service/uploadcare.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-edit-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-avatar.component.html',
  styleUrl: './edit-avatar.component.scss',
})
export class EditAvatarComponent {
  userData$: Observable<any>;

  constructor(
    public workspaceService: WorkspaceService,
    public uploadCareService: UploadCareService
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  updatePhoto(event: any) {
    this.workspaceService.changeAvatarPopUp.set(false);
    this.uploadCareService.onFileSelected(event);
    this.uploadCareService.saveAvatar();
  }

  resetCurrentUserAvatar() {
    this.workspaceService.changeAvatarPopUp.set(false);
    this.uploadCareService.eraseUploadedPhoto();
  }

  closePopUp() {
    this.workspaceService.changeAvatarPopUp.set(false);
  }

  get popUpVisible() {
    return this.workspaceService.changeAvatarPopUp();
  }
}
