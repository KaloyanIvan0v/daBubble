import { HttpClient } from '@angular/common/http';
import { Injectable, Input, signal, OnInit } from '@angular/core';
import { AuthService } from '../auth-services/auth.service';
import { SignupComponent } from 'src/app/core/components/authentication/signup/signup.component';
import { WorkspaceService } from '../workspace-service/workspace.service';
import { authState, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadCareService implements OnInit {
  @Input() signUpComponent?: SignupComponent;
  userData = signal<any>(null);
  currentUser!: User | null;

  uploadCareApiKey = '969c17c5a52163c20fd3';

  selectedPhoto: string | null = null;
  isUploading: boolean = false;
  uploadErrorMessage: string | null = null;
  uploadComplete: boolean = false;
  isUploadedPhoto: boolean = false;
  uploadedPhotoName: string | null = null;
  newAvatarUrl: string | null = null;
  uploadedFileUuid: string | null = null;

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    public workspaceService: WorkspaceService
  ) {
    this.userData = signal(this.workspaceService.loggedInUserData);
  }

  async ngOnInit() {
    const userObservable: Observable<User | null> = authState(
      this.authService.firebaseAuth
    );
    userObservable.subscribe((user) => {
      this.currentUser = user;
    });
  }

  private updateUserProfile(newAvatarUrl: string, currentUser: User | null) {
    if (!currentUser) {
      console.error('Cannot update profile: No current user is available.');
      return;
    }

    this.userData.set({ ...this.userData(), photoURL: newAvatarUrl });
    this.authService
      .updateAvatar(currentUser, newAvatarUrl)
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

  saveAvatar() {
    if (this.selectedPhoto) {
      console.log('Saving avatar with photoURL:', this.selectedPhoto);

      if (this.signUpComponent?.user) {
        this.signUpComponent.user.photoURL = this.selectedPhoto;
      } else if (this.currentUser) {
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
    console.log('Selected photo:', photo);
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
    this.uploadErrorMessage = null;
  }
}
