import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../shared/services/auth-services/auth.service';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { WorkspaceService } from '../../shared/services/workspace-service/workspace.service';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { UploadCareService } from '../../shared/services/uploadcare-service/uploadcare.service';
import { StatefulWindowServiceService } from '../../shared/services/stateful-window-service/stateful-window-service.service';
import { MainService } from '../../shared/services/main-service/main.service';

import { MainWorkspaceComponent } from './main-workspace/main-workspace.component';
import { LeftSideComponentComponent } from './left-side-component/left-side-component.component';
import { RightSideContainerComponent } from './right-side-container/right-side-container.component';
import { HeaderComponent } from './header/header.component';

import { UserMenuComponent } from '../../shared/components/pop-ups/user-menu/user-menu.component';
import { MobileUserMenuComponent } from '../../shared/components/pop-ups/mobile-user-menu/mobile-user-menu.component';
import { OwnProfileEditComponent } from '../../shared/components/pop-ups/own-profile-edit/own-profile-edit.component';
import { OwnProfileViewComponent } from '../../shared/components/pop-ups/own-profile-view/own-profile-view.component';
import { AddChannelComponent } from '../../shared/components/pop-ups/add-channel/add-channel.component';
import { ProfileViewComponent } from '../../shared/components/pop-ups/profile-view/profile-view.component';
import { EditAvatarComponent } from '../../shared/components/pop-ups/edit-avatar/edit-avatar.component';
import { AddMemberAfterCreateComponent } from '../../shared/components/pop-ups/add-member-after-create/add-member-after-create.component';
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MainWorkspaceComponent,
    LeftSideComponentComponent,
    RightSideContainerComponent,
    HeaderComponent,
    CommonModule,
    UserMenuComponent,
    MobileUserMenuComponent,
    OwnProfileEditComponent,
    OwnProfileViewComponent,
    AddChannelComponent,
    ProfileViewComponent,
    EditAvatarComponent,
    AddMemberAfterCreateComponent,
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
  /**
   * The text for the workspace button toggle.
   */
  workspaceButtonText = 'Workspace-Menu öffnen';

  /**
   * Indicates whether the pop-up shadow is visible (potentially used in the template).
   */
  popUpShadowVisible = false; // Could be used in the template

  /**
   * Creates an instance of MainComponent.
   * - Sets the user online immediately.
   * - Optionally retrieves an initial pop-up shadow visibility state from the workspace service.
   * @param authService Service for authentication handling
   * @param firebaseService Service for Firebase connections and operations
   * @param workspaceService Service managing workspace-related state
   * @param authUIService Service handling UI-specific auth logic
   * @param uploadCareService Service handling UploadCare functionality
   * @param statefulWindowService Service for managing window states (mobile/desktop views)
   * @param mainService Main application service, used for setting user online/offline
   * @param router The Angular router
   * @param activatedRoute The currently active route
   */
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    private authUIService: AuthUIService,
    public uploadCareService: UploadCareService,
    private statefulWindowService: StatefulWindowServiceService,
    public mainService: MainService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // Read initial pop-up visibility if needed
    this.popUpShadowVisible = this.workspaceService.popUpShadowVisible();

    // Set user online immediately
    this.mainService.setUserOnline();
  }

  /**
   * Lifecycle hook that runs once the component has been initialized.
   * - Fetches the current user's UID and stores it in FirebaseService.
   * - Checks if the view is mobile to set the initial mobile mode if necessary.
   */
  ngOnInit(): void {
    this.authService
      .getCurrentUserUID()
      .then((uid) => this.firebaseService.setUserUID(uid));

    this.checkIfMobile();
  }

  /**
   * Lifecycle hook that runs once the component is being destroyed.
   * - Clears Firebase data subscriptions.
   * - Sets the user offline.
   * - Unsubscribes from any local subscriptions if used.
   */
  ngOnDestroy(): void {
    this.firebaseService.clearDataSubjects();
    this.mainService.setUserOffline();

    // if (this.popUpStatesSubscription) {
    //   this.popUpStatesSubscription.unsubscribe();
    // }
    // if (this.userDataSubscription) {
    //   this.userDataSubscription.unsubscribe();
    // }
  }

  /**
   * HostListener for window resize events.
   * Closes the left side component if on a medium-sized screen and both left-side and thread are open.
   * Sets the mobile view mode to 'left' if the screen is mobile-sized.
   */
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth < 1400 && window.innerWidth > 960) {
      if (this.showLeftSide() && this.showThread()) {
        this.statefulWindowService.closeLeftSideComponentState();
      }
    } else if (this.isMobile()) {
      this.statefulWindowService.setMobileViewMode('left');
    }
  }

  /**
   * Checks if the window is in mobile mode based on its current width.
   * @returns boolean indicating if it's mobile width
   */
  isMobile(): boolean {
    return window.innerWidth < 960;
  }

  /**
   * Determines whether the left-side component should be shown.
   * - On mobile, it checks if the currently active mobile mode is 'left'.
   * - On desktop, it returns the stored boolean state.
   * @returns boolean indicating whether the left side should be displayed
   */
  showLeftSide(): boolean {
    if (this.isMobile()) {
      return (
        this.statefulWindowService.currentActiveComponentMobile() === 'left'
      );
    }
    return this.statefulWindowService.leftSideComponentState();
  }

  /**
   * Determines whether the chat component should be shown.
   * - On desktop, it always shows.
   * - On mobile, it shows if the currently active component is 'chat'.
   * @returns boolean indicating whether the chat should be displayed
   */
  showChat(): boolean {
    return (
      !this.isMobile() ||
      this.statefulWindowService.currentActiveComponentMobile() === 'chat'
    );
  }

  /**
   * Determines whether the thread (right side) should be shown.
   * - On desktop, it returns true if the right side is open.
   * - On mobile, it checks if the right side is open AND the active component is 'thread'.
   * @returns boolean indicating whether the thread should be displayed
   */
  showThread(): boolean {
    if (!this.isMobile()) {
      return !!this.statefulWindowService.rightSideComponentState();
    }
    return (
      this.statefulWindowService.rightSideComponentState() &&
      this.statefulWindowService.currentActiveComponentMobile() === 'thread'
    );
  }

  /**
   * Checks and updates the service for mobile view if necessary.
   */
  checkIfMobile(): void {
    if (this.isMobile()) {
      this.statefulWindowService.setMobileViewMode('left');
    }
  }

  /**
   * Toggles the left-side workspace menu open or closed
   * and updates the button text accordingly.
   */
  toggleWorkspace(): void {
    this.statefulWindowService.toggleLeftSideComponentState();
    this.workspaceButtonText = this.showLeftSide()
      ? 'Workspace-Menu schließen'
      : 'Workspace-Menu öffnen';
  }

  /**
   * Navigates back to the list view on mobile devices.
   */
  backToList(): void {
    if (this.isMobile()) {
      this.statefulWindowService.backToListOnMobile();
    }
  }

  /**
   * Navigates back to the chat view on mobile devices.
   */
  backToChat(): void {
    if (this.isMobile()) {
      this.statefulWindowService.openChatOnMobile();
    }
  }
}
