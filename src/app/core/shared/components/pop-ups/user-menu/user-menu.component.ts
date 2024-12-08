import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { MainService } from '../../../services/main-service/main.service';

import { AuthService } from '../../../services/auth-services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    public workspaceService: WorkspaceService,
    public mainService: MainService
  ) {}

  logOut() {
    this.workspaceService.currentActiveUnitId.set('12345678');
    this.mainService.setUserOffline();
    this.router.navigate(['app-authentication']);
    this.closePopUp();
    this.authService.logoutUser();
  }

  get popUpVisible() {
    return this.workspaceService.userMenuPopUp();
  }
  closePopUp() {
    this.workspaceService.userMenuPopUp.set(false);
  }

  openProfilePopUp() {
    this.workspaceService.ownProfileViewPopUp.set(true);
  }
}
