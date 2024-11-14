import { UploadcareService } from './../../../shared/services/uploadcare-service/uploadcare.service';
import { Component, Input } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  @Input() signUpComponent!: SignupComponent; // Input to receive signup component reference

  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Müller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];

  constructor(
    public authUIService: AuthUIService,
    public uploadcareService: UploadcareService
  ) {}

  canProceed(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          this.uploadcareService.selectedPhoto !== null ||
            this.uploadcareService.isUploadedPhoto
        );
      }, 1000);
    });
  }
}
