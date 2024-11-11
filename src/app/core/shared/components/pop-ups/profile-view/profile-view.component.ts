import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  constructor(public workspaceService: WorkspaceService) {}

  closePopUp() {
    this.workspaceService.profileViewPopUp.set(false);
  }

  get popUpVisible() {
    return this.workspaceService.profileViewPopUp();
  }
}
