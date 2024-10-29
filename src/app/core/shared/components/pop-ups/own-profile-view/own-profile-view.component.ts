import { Component, signal } from '@angular/core';
import { GlobalDataService } from '../../../services/pop-up-service/global-data.service';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-own-profile-view',
  standalone: true,
  imports: [],
  templateUrl: './own-profile-view.component.html',
  styleUrl: './own-profile-view.component.scss',
})
export class OwnProfileViewComponent {
  userData = signal<any>(null);
  constructor(
    public globalDataService: GlobalDataService,
    public workspaceService: WorkspaceService
  ) {
    this.userData = this.workspaceService.loggedInUserData;
  }

  closeProfileView() {
    this.globalDataService.closePopUp();
  }

  openEditProfilePopUp() {
    this.globalDataService.closePopUp();
    this.globalDataService.openPopUp('ownProfileEdit');
  }
}
