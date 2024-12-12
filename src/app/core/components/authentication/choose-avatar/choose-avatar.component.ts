import { UploadCareService } from './../../../shared/services/uploadcare-service/uploadcare.service';
import { Component, Input, signal } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  @Input() signUpComponent!: SignupComponent; // Input to receive signup component reference
  userData$: Observable<any>;

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
    public activatedRoute: ActivatedRoute
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  canProceed(): boolean {
    return (
      this.uploadCareService.selectedPhoto !== null &&
      this.uploadCareService.uploadComplete &&
      !this.uploadCareService.isUploading
    );
  }

  navigateToSignup() {
    this.router.navigate(['/authentication/signup']);
  }
}
