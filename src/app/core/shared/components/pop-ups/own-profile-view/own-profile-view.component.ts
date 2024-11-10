import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-own-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './own-profile-view.component.html',
  styleUrl: './own-profile-view.component.scss',
})
export class OwnProfileViewComponent {
  userData = signal<any>(null);
  constructor(public workspaceService: WorkspaceService) {
    this.userData = this.workspaceService.loggedInUserData;
  }

  closePopUp() {
    this.workspaceService.ownProfileViewPopUp.set(false);
  }

  openEditProfilePopUp() {
    this.workspaceService.ownProfileViewPopUp.set(true);
  }

  get popUpVisible() {
    return this.workspaceService.ownProfileViewPopUp();
  }
}
