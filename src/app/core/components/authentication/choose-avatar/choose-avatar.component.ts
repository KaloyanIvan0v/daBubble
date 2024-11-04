import { Component, Input } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  @Input() signUpComponent!: SignupComponent; // Input to receive signup component reference

  currentUser!: User | null;
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

  uploadcareApiKey = '969c17c5a52163c20fd3';
  isUploading: boolean = false;
  uploadComplete: boolean = false;

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.init();
  }

  async init() {
    const userObservable: Observable<User | null> = authState(
      this.authService.firebaseAuth
    );
    userObservable.subscribe((user) => {
      this.currentUser = user;
    });
  }

  selectPhoto(photo: string) {
    this.selectedPhoto = photo;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.photoURL = photo;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedPhoto = reader.result as string; // Preview image
        this.isUploadedPhoto = true;
        this.uploadedPhotoName = file.name;
        this.isUploading = true;
        this.uploadToUploadcare(file);
      };
      reader.readAsDataURL(file);
    }
  }

  uploadToUploadcare(file: File) {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', this.uploadcareApiKey);
    formData.append('UPLOADCARE_STORE', 'auto');
    formData.append('file', file);

    const uploadUrl = 'https://upload.uploadcare.com/base/'; // Uploadcare API endpoint

    this.http.post(uploadUrl, formData).subscribe(
      (response: any) => {
        console.log('File uploaded successfully:', response);
        this.selectedPhoto = `https://ucarecdn.com/${response.file}/`; // URL of the uploaded image
        this.isUploadedPhoto = true;
        this.uploadedPhotoName = file.name;
        this.signUpComponent.user.photoURL = this.selectedPhoto; // Set photo URL in signup component
        this.uploadComplete = true; // Mark upload as complete
        this.isUploading = false; // Uploading is done
        console.log(
          'Photo URL after upload:',
          this.signUpComponent.user.photoURL
        );
      },
      (error) => {
        console.error('Error uploading to Uploadcare:', error);
      }
    );
  }

  eraseUploadedPhoto() {
    this.selectedPhoto = null;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.photoURL = '';
  }

  saveAvatar() {
    if (this.selectedPhoto && this.currentUser) {
      console.log(
        'Saving avatar with photoURL:',
        this.signUpComponent.user.photoURL
      );

      this.authService
        .updateAvatar(this.currentUser, this.signUpComponent.user.photoURL)
        .then(() => {
          console.log('Avatar updated successfully!');
          this.authUIService.toggleAvatarSelection();
          this.router.navigate(['/dashboard']);
        })
        .catch((error) => console.error('Error updating avatar:', error));
    } else {
      console.error(
        'Cannot save avatar: Upload incomplete or no photo selected.'
      );
    }
  }
}
