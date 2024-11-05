import { Component, Input, signal } from '@angular/core';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
import { SignupComponent } from '../signup/signup.component';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
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

  selectedPhoto: string | null = null; // Placeholder shown initially
  isUploadedPhoto: boolean = false;
  uploadedPhotoName: string | null = null;

  uploadcareApiKey = '969c17c5a52163c20fd3';
  isUploading: boolean = false;
  uploadComplete: boolean = false;
  uploadErrorMessage: string | null = null;
  isFileSizeValid: boolean = false;

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    public workspaceService: WorkspaceService,
    private router: Router,
    private http: HttpClient
  ) {
    this.init();
    this.userData = this.workspaceService.loggedInUserData;
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
    if (!file) return;

    if (!this.validateFileSize(file)) {
      this.isUploadedPhoto = false;
      return;
    }

    this.readFile(file);
  }

  private validateFileSize(file: File): boolean {
    const maxFileSize = 2 * 1024 * 1024; // 2MB size limit
    if (file.size > maxFileSize) {
      this.uploadErrorMessage =
        'File size exceeds the 2MB limit. Please choose a smaller file.';
      return false;
    }
    this.uploadErrorMessage = null;
    return true;
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

    // Simulate upload completion
    setTimeout(() => {
      this.isUploading = false;
      this.uploadComplete = true;
    }, 3000);

    this.uploadToUploadcare(file); // Call the upload function
  }

  uploadToUploadcare(file: File) {
    const formData = this.createUploadcareFormData(file);
    const uploadUrl = 'https://upload.uploadcare.com/base/';

    this.http.post(uploadUrl, formData).subscribe(
      (response: any) => this.handleUploadSuccess(response, file),
      (error) => this.handleUploadError(error)
    );
  }

  private createUploadcareFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', this.uploadcareApiKey);
    formData.append('UPLOADCARE_STORE', 'auto');
    formData.append('file', file);
    return formData;
  }

  private handleUploadSuccess(response: any, file: File) {
    this.selectedPhoto = `https://ucarecdn.com/${response.file}/`;
    this.isUploadedPhoto = true;
    this.uploadedPhotoName = file.name;
    this.uploadComplete = true;
    this.isUploading = false;
    this.signUpComponent.user.photoURL = this.selectedPhoto;
  }

  private handleUploadError(error: any) {
    this.isUploading = false;
    this.uploadComplete = false;

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
