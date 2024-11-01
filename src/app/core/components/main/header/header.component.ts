import { Component, signal } from '@angular/core';
import { GlobalDataService } from '../../../shared/services/pop-up-service/global-data.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';

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
    public workspaceService: WorkspaceService,
    private authService: AuthService
  ) {
    this.userData = this.workspaceService.loggedInUserData;
  }
  ngOnInit() {
    // Subscribe to user data from AuthService
    this.authService.getCurrentUser().subscribe((user) => {
      this.userData.set(user); // Update signal value with the current user
      console.log('User Avatar:', this.userData()?.photoURL); // Log user photo URL for debugging
    });
  }

  openPopUp() {
    this.globalDataService.openPopUp('userMenu');
  }
}
