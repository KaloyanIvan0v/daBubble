import { Component, signal } from '@angular/core';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  userData = signal<any>(null);
  private userSubscription!: Subscription; // Store subscription for cleanup

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    private authService: AuthService
  ) {
    this.userData = this.workspaceService.loggedInUserData;
  }
  ngOnInit() {
    this.userSubscription = this.authService
      .getCurrentUser()
      .subscribe((user) => {
        this.userData.set(user); // Update signal value with the current user
        console.log('User Avatar:', this.userData()?.photoURL);
      });
  }

  ngOnDestroy() {
    // Cleanup the subscription to avoid memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  openPopUp() {}
}
