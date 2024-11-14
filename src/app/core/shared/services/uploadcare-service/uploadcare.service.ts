import { ChooseAvatarComponent } from 'src/app/core/components/authentication/choose-avatar/choose-avatar.component';
import { HttpClient } from '@angular/common/http';
import { Injectable, Input, signal } from '@angular/core';
import { AuthService } from '../auth-services/auth.service';
import { SignupComponent } from 'src/app/core/components/authentication/signup/signup.component';
import { WorkspaceService } from '../workspace-service/workspace.service';

@Injectable({
  providedIn: 'root',
})
export class UploadcareService {
  @Input() signUpComponent!: SignupComponent;
  @Input() currentUser: any;
  userData = signal<any>(null);

  uploadcareApiKey = '969c17c5a52163c20fd3';

  selectedPhoto: string | null = null;
  isUploading: boolean = false;
  uploadErrorMessage: string | null = null;
  uploadComplete: boolean = false;
  isUploadedPhoto: boolean = false;
  uploadedPhotoName: string | null = null;
  newAvatarUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    public workspaceService: WorkspaceService
  ) {
    this.userData = signal(this.workspaceService.loggedInUserData);
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
    this.authService.getCurrentUser().subscribe((currentUser) => {
      if (!currentUser && !this.signUpComponent) {
        console.error('Cannot save avatar: No user is currently available.');
      } else {
        setTimeout(() => {
          this.newAvatarUrl = `https://ucarecdn.com/${response.file}/`;
          this.updateAvatarSelectionUI(this.newAvatarUrl, file.name);
          if (this.signUpComponent?.user) {
            this.signUpComponent.user.photoURL = this.newAvatarUrl;
          } else if (currentUser) {
            this.updateUserProfile(this.newAvatarUrl);
          } else {
            console.error(
              'Cannot save avatar: No user is currently available.'
            );
          }
        }, 1000);
      }
    });
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

  saveAvatar() {
    if (this.selectedPhoto) {
      console.log('Saving avatar with photoURL:', this.selectedPhoto);

      if (this.signUpComponent?.user) {
        // Update avatar for user in sign-up flow
        this.signUpComponent.user.photoURL = this.selectedPhoto;
      } else if (this.currentUser) {
        // Update avatar for currently logged-in user

        this.authService
          .updateAvatar(this.currentUser, this.newAvatarUrl ?? '')
          .then(() => {
            console.log('Avatar updated successfully!');
          })
          .catch((error) => console.error('Error updating avatar:', error));
      }
    }
  }

  selectPhoto(photo: string) {
    this.selectedPhoto = photo;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    if (this.signUpComponent) {
      this.signUpComponent.user.photoURL = photo;
    }
  }

  resetSelectedPhoto() {
    this.selectedPhoto = null;
    this.isUploadedPhoto = false;
    this.uploadedPhotoName = null;
    this.signUpComponent.user.photoURL = '';
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
      }
    } else {
      console.log(
        'No user or sign-up component available to reset the avatar.'
      );
    }

    this.uploadErrorMessage = null;
  }
}
