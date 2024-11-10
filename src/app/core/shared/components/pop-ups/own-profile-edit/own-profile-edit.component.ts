import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-own-profile-edit',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './own-profile-edit.component.html',
  styleUrl: './own-profile-edit.component.scss',
})
export class OwnProfileEditComponent {
  userData = signal<any>(null);
  constructor(public workspaceService: WorkspaceService) {
    this.userData = this.workspaceService.loggedInUserData;
  }

  closePopUp() {
    this.workspaceService.ownProfileEditPopUp.set(false);
  }

  openEditProfilePopUp() {
    this.workspaceService.ownProfileEditPopUp.set(true);
  }

  get popUpVisible() {
    return this.workspaceService.ownProfileEditPopUp();
  }
}
