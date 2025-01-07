import { Component, effect } from '@angular/core';
import { AuthService } from '../../../services/auth-services/auth.service';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { MainService } from '../../../services/main-service/main.service';
import { CommonModule } from '@angular/common';

/**
 * including user logout and profile popup management.
 */
@Component({
  selector: 'app-mobile-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-user-menu.component.html',
  styleUrls: ['./mobile-user-menu.component.scss'],
})
export class MobileUserMenuComponent {
  /**
   * Constructs the MobileUserMenuComponent and sets up reactive effects.
   * @param authService - Service handling authentication operations.
   * @param router - Angular Router for navigation.
   * @param workspaceService - Service managing workspace-related states.
   * @param mainService - Main service for application-wide operations.
   */
  constructor(
    public authService: AuthService,
    private router: Router,
    public workspaceService: WorkspaceService,
    public mainService: MainService
  ) {
    // Sets up an effect to log the visibility state of the mobile user menu.
    effect(() => {
      console.log(
        'MobileUserMenu visibility (effect):',
        this.workspaceService.mobileUserMenuPopUp()
      );
    });
  }

  /**
   * Logs out the current user by performing necessary state updates and navigating to the login page.
   */
  logOut(): void {
    // Set the current active unit ID to a default or placeholder value.
    this.workspaceService.currentActiveUnitId.set('12345678');

    // Mark the user as offline in the main service.
    this.mainService.setUserOffline();

    // Navigate to the authentication login route.
    this.router.navigate(['authentication', 'login']);

    // Close the mobile user menu popup.
    this.closePopUp();

    // Perform additional logout operations via AuthService.
    this.authService.logoutUser();
  }

  /**
   * Retrieves the visibility state of the mobile user menu popup.
   * @returns A boolean indicating whether the popup is visible.
   */
  get popUpVisible(): boolean {
    return this.workspaceService.mobileUserMenuPopUp();
  }

  /**
   * Closes the mobile user menu popup by updating the workspace service state.
   */
  closePopUp(): void {
    this.workspaceService.mobileUserMenuPopUp.set(false);
  }

  /**
   * Opens the profile popup and closes the mobile user menu popup.
   */
  openProfilePopUp(): void {
    this.workspaceService.ownProfileViewPopUp.set(true);
    this.closePopUp();
  }
}
