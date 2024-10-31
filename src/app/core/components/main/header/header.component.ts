import { Component, signal } from '@angular/core';
import { GlobalDataService } from '../../../shared/services/pop-up-service/global-data.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  userData = signal<any>(null);

  constructor(
    public globalDataService: GlobalDataService,
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService
  ) {
    this.userData = this.workspaceService.loggedInUserData;
  }

  openPopUp() {
    this.globalDataService.openPopUp('userMenu');
  }
}
