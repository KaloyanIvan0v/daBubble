import { ChooseAvatarComponent } from 'src/app/core/components/authentication/choose-avatar/choose-avatar.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-own-profile-view',
  standalone: true,
  imports: [CommonModule, ChooseAvatarComponent],
  templateUrl: './own-profile-view.component.html',
  styleUrls: ['./own-profile-view.component.scss'],
})
export class OwnProfileViewComponent {
  @Input() chooseAvatarComponent!: ChooseAvatarComponent; // Receive component as input

  userData$: Observable<any>;

  constructor(
    public workspaceService: WorkspaceService,
    private authService: AuthService
  ) {
    // Assuming loggedInUserData$ is exposed in WorkspaceService
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  closePopUp() {
    this.workspaceService.ownProfileViewPopUp.set(false);
  }

  openEditProfilePopUp() {
    this.closePopUp();
    this.workspaceService.ownProfileEditPopUp.set(true);
  }

  get popUpVisible() {
    return this.workspaceService.ownProfileViewPopUp();
  }

  updatePhoto(event: any) {
    this.chooseAvatarComponent.onFileSelected(event);
    this.chooseAvatarComponent.saveAvatar();
  }
}
