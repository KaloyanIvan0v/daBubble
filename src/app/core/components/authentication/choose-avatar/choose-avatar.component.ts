import { Component, Input } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage'; // Ensure correct import

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

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    private router: Router,
    private storage: Storage // Inject Storage here
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

        // Create a storage reference
        const storageRef = ref(this.storage, `avatars/${file.name}`);
        uploadBytes(storageRef, file)
          .then((snapshot) => {
            console.log('Uploaded a blob or file!');

            // Get the download URL after upload
            getDownloadURL(snapshot.ref).then((downloadURL) => {
              this.signUpComponent.user.photoURL = downloadURL; // Update with the storage URL
              console.log('File available at', downloadURL); // Log the download URL
            });
          })
          .catch((error) => {
            console.error('Error uploading file:', error);
          });
      };
      reader.readAsDataURL(file);
    }
  }

  eraseUploadedPhoto() {
    this.selectedPhoto = null;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.photoURL = '';
  }

  saveAvatar() {
    if (this.selectedPhoto && this.currentUser) {
      this.authService
        .updateAvatar(this.currentUser, this.signUpComponent.user.photoURL)
        .then(() => {
          console.log('Avatar updated successfully!');
          this.authUIService.toggleAvatarSelection();
          this.router.navigate(['/dashboard']);
        })
        .catch((error) => console.error('Error updating avatar:', error));
    }
  }
}
