import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { User } from '../../../models/user.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-own-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './own-profile-edit.component.html',
  styleUrls: ['./own-profile-edit.component.scss'],
})
export class OwnProfileEditComponent implements OnInit, OnDestroy {
  userData: User = new User('', '', '', '', [], true);
  sanitizedUrl!: SafeResourceUrl;
  selectedPhoto: string | null = null;
  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Mueller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];

  private userSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private authService: AuthService
  ) {}

  /**
   * Initializes the component by fetching the current user's data.
   */
  ngOnInit(): void {
    this.authService.getCurrentUserUID().then((userId) => {
      if (userId) {
        this.firebaseService
          .getUser(userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe((user: User) => {
            this.userData = { ...user };
          });
      }
    });
  }

  /**
   * Cleans up subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Closes the profile edit popup by updating the workspace service state.
   */
  closePopUp(): void {
    this.workspaceService.ownProfileEditPopUp.set(false);
  }

  /**
   * Opens the profile edit popup by updating the workspace service state.
   */
  openEditProfilePopUp(): void {
    this.workspaceService.ownProfileEditPopUp.set(true);
  }

  /**
   * Retrieves the visibility state of the profile edit popup.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible(): boolean {
    return this.workspaceService.ownProfileEditPopUp();
  }

  /**
   * Cancels the profile edit operation and closes the popup.
   */
  cancelEdit(): void {
    this.closePopUp();
  }

  /**
   * Saves the edited profile data by updating the user document in Firebase
   * and updating the user data in the workspace service.
   */
  async saveEdit(): Promise<void> {
    await this.firebaseService.updateDoc(
      'users',
      this.userData.uid,
      this.userData
    );
    this.workspaceService.ownProfileEditPopUp.set(false);
    this.workspaceService.updateUser(this.userData);
  }

  /**
   * Sets the user's profile photo URL.
   * @param photo - The URL of the selected photo.
   */
  setUserPhoto(photo: string): void {
    this.userData.photoURL = photo;
  }

  validEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.userData.email);
  }

  validName(): boolean {
    return this.userData.name.trim().length > 1;
  }
}
