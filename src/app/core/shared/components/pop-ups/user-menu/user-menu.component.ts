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
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent {
  constructor(
    public authService: AuthService,
    private router: Router,
    public workspaceService: WorkspaceService,
    public mainService: MainService
  ) {}

  /**
   * Logs out the current user by performing necessary cleanup and navigation.
   */
  logOut(): void {
    this.resetActiveUnit();
    this.setUserOffline();
    this.navigateToLogin();
    this.closePopUp();
    this.performLogout();
  }

  /**
   * Retrieves the visibility status of the user menu popup.
   * @returns {boolean} - True if the popup is visible, otherwise false.
   */
  get popUpVisible(): boolean {
    return this.workspaceService.userMenuPopUp();
  }

  /**
   * Closes the user menu popup.
   */
  closePopUp(): void {
    this.workspaceService.userMenuPopUp.set(false);
  }

  /**
   * Opens the profile view popup.
   */
  openProfilePopUp(): void {
    this.workspaceService.ownProfileViewPopUp.set(true);
  }

  /**
   * Resets the current active unit ID to a default value.
   */
  private resetActiveUnit(): void {
    this.workspaceService.currentActiveUnitId.set('12345678');
  }

  /**
   * Sets the user's status to offline.
   */
  private setUserOffline(): void {
    this.mainService.setUserOffline();
  }

  /**
   * Navigates the user to the login page.
   */
  private navigateToLogin(): void {
    this.router.navigate(['authentication', 'login']);
  }

  /**
   * Performs the user logout operation.
   */
  private performLogout(): void {
    this.authService.logoutUser();
  }
}
