import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { User } from '../../../models/user.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { SafeResourceUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-own-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './own-profile-edit.component.html',
  styleUrl: './own-profile-edit.component.scss',
})
export class OwnProfileEditComponent {
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
  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUserUID().then((userId) => {
      if (userId) {
        this.firebaseService.getUser(userId).subscribe((user: User) => {
          this.userData = { ...user };
        });
      }
    });
  }

  ngOnDestroy() {}

  closePopUp() {
    this.workspaceService.ownProfileEditPopUp.set(false);
  }

  openEditProfilePopUp() {
    this.workspaceService.ownProfileEditPopUp.set(true);
  }

  get popUpVisible() {
    return this.workspaceService.ownProfileEditPopUp();
  }

  cancelEdit() {
    this.workspaceService.ownProfileEditPopUp.set(false);
  }

  async saveEdit() {
    this.firebaseService.updateDoc('users', this.userData.uid, this.userData);
    this.workspaceService.ownProfileEditPopUp.set(false);
    this.workspaceService.updateUser(this.userData);
  }

  setUserPhoto(photo: string) {
    this.userData.photoURL = photo;
  }
}
