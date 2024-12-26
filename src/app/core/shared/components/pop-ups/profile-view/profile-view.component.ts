import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Observable } from 'rxjs';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { User } from 'src/app/core/shared/models/user.class';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  userData$!: Observable<any>;

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService
  ) {
    effect(() => {
      this.userData$ = this.firebaseService.getUser(
        this.workspaceService.currentActiveUserId()
      );
    });
  }

  closePopUp() {
    this.workspaceService.profileViewPopUp.set(false);
  }

  get popUpVisible() {
    return this.workspaceService.profileViewPopUp();
  }

  openChat() {}

  openDirectChat(userUid: string) {}

  getDirectChatByUserId(userUid: string) {}
}
