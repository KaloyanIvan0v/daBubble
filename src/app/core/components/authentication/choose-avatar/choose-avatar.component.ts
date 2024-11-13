import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent implements OnInit, OnDestroy {
  private userSubscription: any; // To store the subscription
  @Input() signUpComponent!: SignupComponent; // Input to receive signup component reference
  userData = signal<any>(null);
  currentUser!: User | null;

  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Müller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];

  selectedPhoto: string | null = null;
  isUploadedPhoto: boolean = false;
  uploadedPhotoName: string | null = null;

  uploadcareApiKey = '969c17c5a52163c20fd3';
  isUploading: boolean = false;
  uploadComplete: boolean = false;
  uploadErrorMessage: string | null = null;

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    public workspaceService: WorkspaceService,
    private router: Router,
    private http: HttpClient
  ) {
    this.userData = signal(this.workspaceService.loggedInUserData);
  }

  ngOnInit(): void {
    const userObservable: Observable<User | null> = authState(
      this.authService.firebaseAuth
    );
    this.userSubscription = userObservable.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe(); // Unsubscribe to avoid memory leaks
    }
  }

  selectPhoto(photo: string) {
    this.selectedPhoto = photo;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    if (this.signUpComponent) {
      this.signUpComponent.user.photoURL = photo;
    } else if (this.currentUser) {
      this.userData.set({ ...this.userData(), photoURL: photo });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!this.validateFileSize(file)) {
      this.isUploadedPhoto = false;
      return;
    }

    this.readFile(file);
    return file;
  }

  private validateFileSize(file: File): boolean {
    const maxFileSize = 2 * 1024 * 1024; // 2MB size limit
    if (file.size > maxFileSize) {
      this.uploadErrorMessage =
        'File size exceeds the 2MB limit. Please choose a smaller file.';
      this.resetSelectedPhoto(); // Reset selected photo to placeholder
      return false;
    } else {
      this.uploadErrorMessage = null;
      return true;
    }
  }

  private resetSelectedPhoto() {
    this.selectedPhoto = null;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.photoURL = '';
  }

  private readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () =>
      this.handleFileLoadSuccess(reader.result as string, file);
    reader.readAsDataURL(file);
  }

  private handleFileLoadSuccess(result: string, file: File) {
    this.selectedPhoto = result;
    this.isUploadedPhoto = true;
    this.uploadedPhotoName = file.name;
    this.isUploading = true;

    // Start the actual file upload
    this.uploadToUploadcare(file);
  }

  uploadToUploadcare(file: File) {
    const formData = this.createUploadcareFormData(file);
    const uploadUrl = 'https://upload.uploadcare.com/base/';

    this.http.post(uploadUrl, formData).subscribe({
      next: (response: any) => this.handleUploadSuccess(response, file),
      error: (error) => this.handleUploadError(error),
      complete: () => {
        // Set upload state based on actual completion
        this.isUploading = false;
        this.uploadComplete = true;
        console.log('Upload completed');
      },
    });
  }

  private createUploadcareFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', this.uploadcareApiKey);
    formData.append('UPLOADCARE_STORE', 'auto');
    formData.append('file', file);
    return formData;
  }

  private handleUploadSuccess(response: any, file: File) {
    setTimeout(() => {
      const newAvatarUrl = `https://ucarecdn.com/${response.file}/`;
      this.updateAvatarSelectionUI(newAvatarUrl, file.name);
      if (this.signUpComponent?.user) {
        this.signUpComponent.user.photoURL = newAvatarUrl;
      } else if (this.currentUser) {
        this.updateUserProfile(newAvatarUrl);
      } else {
        console.error('Cannot save avatar: No user is currently available.');
      }
    }, 1000);
  }

  private updateAvatarSelectionUI(newAvatarUrl: string, fileName: string) {
    this.selectedPhoto = newAvatarUrl;
    this.isUploadedPhoto = true;
    this.uploadedPhotoName = fileName;
    this.uploadComplete = true;
    this.isUploading = false;
  }

  private updateUserProfile(newAvatarUrl: string) {
    if (!this.currentUser) {
      console.error('Cannot update profile: No current user is available.');
      return;
    }

    this.userData.set({ ...this.userData(), photoURL: newAvatarUrl });
    this.authService
      .updateAvatar(this.currentUser, newAvatarUrl)
      .then(() => {
        console.log('Avatar updated successfully for current user');
        const updatedUserData = {
          ...this.workspaceService.loggedInUserData.getValue(),
          avatar: newAvatarUrl,
        };
        this.workspaceService.updateLoggedInUserData(updatedUserData);
      })
      .catch((error) => console.error('Error updating avatar:', error));
  }

  private handleUploadError(error: any) {
    this.isUploading = false;
    this.uploadComplete = false;
    this.isUploadedPhoto = false; // Prevent showing any uploaded image
    this.selectedPhoto = null; // Clear any previous preview

    if (error.status === 404) {
      this.uploadErrorMessage =
        'Uploadcare API not found. Please check the API endpoint.';
    } else if (error.status === 413) {
      this.uploadErrorMessage =
        'File is too large. Please choose a smaller file.';
    } else {
      this.uploadErrorMessage =
        'Error uploading to Uploadcare. Please try again.';
    }
  }

  eraseUploadedPhoto() {
    if (!this.isUploading) {
      this.selectedPhoto = null;
      this.uploadedPhotoName = null;
      this.uploadComplete = false;
      this.isUploadedPhoto = false;
      this.isUploading = false;

      // Check if the user is in sign-up flow and reset their photoURL if so
      if (this.signUpComponent?.user) {
        this.signUpComponent.user.photoURL = '';
      } else if (this.currentUser) {
        // Reset photo URL for the current user
        this.userData.set({ ...this.userData(), photoURL: '' });
        console.log('Avatar erased for current user.');
      } else {
        console.log(
          'No user or sign-up component available to reset the avatar.'
        );
      }

      this.uploadErrorMessage = null;
    }
  }

  saveAvatar() {
    if (this.selectedPhoto) {
      console.log('Saving avatar with photoURL:', this.selectedPhoto);

      if (this.signUpComponent?.user) {
        // Update avatar for user in sign-up flow
        this.signUpComponent.user.photoURL = this.selectedPhoto;
      } else if (this.currentUser) {
        // Update avatar for currently logged-in user
        this.authService
          .updateAvatar(this.currentUser, this.selectedPhoto)
          .then(() => {
            console.log('Avatar updated successfully!');
          })
          .catch((error) => console.error('Error updating avatar:', error));
      }
    } else {
      console.error('No photo selected to save as avatar');
    }
  }

  canProceed(): boolean {
    // The "Weiter" button is enabled if a photo is selected or a valid file is uploaded
    return this.selectedPhoto !== null || this.isUploadedPhoto;
  }
}
