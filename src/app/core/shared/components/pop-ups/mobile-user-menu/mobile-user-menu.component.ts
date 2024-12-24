import { Component, effect } from '@angular/core';
import { AuthService } from '../../../services/auth-services/auth.service';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { MainService } from '../../../services/main-service/main.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-mobile-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-user-menu.component.html',
  styleUrl: './mobile-user-menu.component.scss',
})
export class MobileUserMenuComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    public workspaceService: WorkspaceService,
    public mainService: MainService
  ) {
    effect(() => {
      console.log(
        'MobileUserMenu visibility (effect):',
        this.workspaceService.mobileUserMenuPopUp()
      );
    });
  }

  logOut() {
    this.workspaceService.currentActiveUnitId.set('12345678');
    this.mainService.setUserOffline();
    this.router.navigate(['authentication', 'login']);
    this.closePopUp();
    this.authService.logoutUser();
  }

  get popUpVisible() {
    return this.workspaceService.mobileUserMenuPopUp();
  }
  closePopUp() {
    this.workspaceService.mobileUserMenuPopUp.set(false);
  }

  openProfilePopUp() {
    this.workspaceService.ownProfileViewPopUp.set(true);
    this.closePopUp();
  }
}
