import { Component, Input } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  @Input() signUpComponent!: SignupComponent; // Input to receive signup component reference
  constructor(public authUIService: AuthUIService) {}

  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Müller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];

  selectedPhoto: string | null = null; // Placeholder shown initially
  isUploadedPhoto: boolean = false;
  uploadedPhotoName: string | null = null;

  selectPhoto(photo: string) {
    this.selectedPhoto = photo;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.avatar = photo; // Set the avatar in signup component
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedPhoto = reader.result as string;
        this.signUpComponent.user.avatar = this.selectedPhoto; // Update the avatar in signup component
        this.isUploadedPhoto = true;
        this.uploadedPhotoName = file.name;
      };
      reader.readAsDataURL(file);
    }
  }

  eraseUploadedPhoto() {
    this.selectedPhoto = null;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.avatar = ''; // Clear avatar in signup component
  }

  finalizeSignup() {
    // This function can be triggered to finalize signup after choosing an avatar
    this.signUpComponent.finalizeRegistration(); // Call finalize registration from signup component
  }
}
