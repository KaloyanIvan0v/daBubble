import { UploadCareService } from './../../shared/services/uploadcare-service/uploadcare.service';
import { SignupComponent } from './../authentication/signup/signup.component';
import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainWorkspaceComponent } from './main-workspace/main-workspace.component';
import { LeftSideComponentComponent } from './left-side-component/left-side-component.component';
import { RightSideContainerComponent } from './right-side-container/right-side-container.component';
import { HeaderComponent } from './header/header.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth-services/auth.service';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { WorkspaceService } from '../../shared/services/workspace-service/workspace.service';
import { UserMenuComponent } from '../../shared/components/pop-ups/user-menu/user-menu.component';
import { OwnProfileViewComponent } from '../../shared/components/pop-ups/own-profile-view/own-profile-view.component';
import { OwnProfileEditComponent } from '../../shared/components/pop-ups/own-profile-edit/own-profile-edit.component';
import { AddChannelComponent } from '../../shared/components/pop-ups/add-channel/add-channel.component';
import { ProfileViewComponent } from '../../shared/components/pop-ups/profile-view/profile-view.component';
import { ChooseAvatarComponent } from '../authentication/choose-avatar/choose-avatar.component';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { EditAvatarComponent } from '../../shared/components/pop-ups/edit-avatar/edit-avatar.component';
import { StatefulWindowServiceService } from '../../shared/services/stateful-window-service/stateful-window-service.service';
import { MainService } from '../../shared/services/main-service/main.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Routes } from '@angular/router';

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
    OwnProfileEditComponent,
    OwnProfileViewComponent,
    AddChannelComponent,
    ProfileViewComponent,
    EditAvatarComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  chooseAvatarComponent: ChooseAvatarComponent;
  signupComponent: SignupComponent;
  workspaceButtonText: string = 'Workspace-Menu öffnen';
  popUpShadowVisible: boolean = false;
  private popUpStatesSubscription!: Subscription;

  userDataSubscription!: Subscription;
  currentUser: any = null;

  resizeSubscription!: Subscription;
  innerWidth: number = window.innerWidth;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    private authUIService: AuthUIService,
    public uploadCareService: UploadCareService,
    private statefulWindowService: StatefulWindowServiceService,
    public mainService: MainService,
    public router: Router,
    public activatedRoute: ActivatedRoute
  ) {
    this.popUpShadowVisible = this.workspaceService.popUpShadowVisible();
    this.chooseAvatarComponent = new ChooseAvatarComponent(
      this.workspaceService,
      this.uploadCareService,
      this.authUIService,
      this.router,
      this.activatedRoute
    );

    this.signupComponent = new SignupComponent(
      this.authUIService,
      this.authService,
      this.workspaceService,
      this.router,
      this.activatedRoute
    );
    this.mainService.setUserOnline();
  }

  ngOnInit(): void {
    this.authService.getCurrentUserUID().then((uid) => {
      this.firebaseService.setUserUID(uid);
    });
    this.checkIfMobile();
  }

  ngOnDestroy(): void {
    this.mainService.setUserOffline();
    if (this.popUpStatesSubscription) {
      this.popUpStatesSubscription.unsubscribe();
    }

    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    if (window.innerWidth < 1400 && window.innerWidth > 960) {
      if (this.leftSideComponentOpen && this.rightSideComponentOpen) {
        this.statefulWindowService.closeLeftSideComponentState();
      }
    } else if (window.innerWidth < 960) {
      this.statefulWindowService.setMobileViewMode('left');
    }
  }

  isMobile(): boolean {
    return window.innerWidth < 960;
  }

  showLeftSide(): boolean {
    return (
      !this.isMobile() ||
      this.statefulWindowService.currentActiveComponentMobile() === 'left'
    );
  }

  showChat(): boolean {
    return (
      !this.isMobile() ||
      this.statefulWindowService.currentActiveComponentMobile() === 'chat'
    );
  }

  showThread(): boolean {
    return (
      !this.isMobile() ||
      this.statefulWindowService.currentActiveComponentMobile() === 'thread'
    );
  }

  checkIfMobile() {
    if (window.innerWidth < 960) {
      this.statefulWindowService.setMobileViewMode('left');
    }
  }

  get leftSideComponentOpen() {
    return this.statefulWindowService.leftSideComponentState();
  }

  get rightSideComponentOpen() {
    return this.statefulWindowService.rightSideComponentState();
  }

  toggleWorkspace() {
    this.statefulWindowService.toggleLeftSideComponentState();
    this.changeText();
  }

  changeText() {
    this.workspaceButtonText = this.leftSideComponentOpen
      ? 'Workspace-Menu schließen'
      : 'Workspace-Menu öffnen';
  }

  openThread() {
    if (window.innerWidth < 960) {
      this.statefulWindowService.openThreadOnMobile();
    } else {
      // On large screens, right side can be opened by service logic
      this.statefulWindowService.openRightSideComponentState();
    }
  }

  backToList() {
    if (window.innerWidth < 960) {
      this.statefulWindowService.backToListOnMobile();
    } else {
      // On larger screens, 'backToList' might not do much.
      // You could choose to close the right side panel if you want:
      this.statefulWindowService.closeRightSideComponentState();
    }
  }

  backToChat() {
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    } else {
      // On larger screens, this might mean just closing the thread panel:
      this.statefulWindowService.closeRightSideComponentState();
    }
  }
}
