import { UploadCareService } from './../../../shared/services/uploadcare-service/uploadcare.service';
import { Component, Input } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  @Input() signUpComponent!: SignupComponent;
  userData$: Observable<any>;

  selectedPhoto: string | null = null;

  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Mueller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];

  constructor(
    public workspaceService: WorkspaceService,
    public uploadCareService: UploadCareService,
    public authUIService: AuthUIService,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public AuthService: AuthService
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  /**
   * Checks if the user can proceed to the next step in the registration process.
   * This is the case if either a photo has been selected or a photo has been uploaded.
   * @returns {boolean} Whether the user can proceed to the next step.
   */
  canProceed(): boolean {
    return (
      this.uploadCareService.selectedPhoto !== null ||
      (this.uploadCareService.uploadComplete &&
        !this.uploadCareService.isUploading)
    );
  }

  navigateToSignup() {
    this.router.navigate(['/authentication/signup']);
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Called when the user successfully signs up. Sets the showAccountCreated flag
   * to true, waits for 1.5 seconds, then sets it back to false and navigates to
   * the dashboard.
   */
  signUpSuccess() {
    this.authUIService.showAccountCreated = true;

    setTimeout(() => {
      this.authUIService.showAccountCreated = false;
      this.navigateToDashboard();
    }, 1500);
  }

  /**
   * Sets the selected photo for the user and updates the user's avatar.
   * @param photo The selected photo URL.
   */
  setUserPhoto(photo: string) {
    this.selectedPhoto = photo;
    this.AuthService.currentUser$.subscribe((user) => {
      if (user) {
        this.AuthService.updateAvatar(user, photo);
      }
    });
  }
}
