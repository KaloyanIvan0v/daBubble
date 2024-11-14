import { SignupComponent } from './../authentication/signup/signup.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainWorkspaceComponent } from './main-workspace/main-workspace.component';
import { LeftSideComponentComponent } from './left-side-component/left-side-component.component';
import { RightSideContainerComponent } from './right-side-container/right-side-container.component';
import { HeaderComponent } from './header/header.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth-services/auth.service';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { ChannelChatComponent } from './main-workspace/channel-chat/channel-chat.component';
import { WorkspaceService } from '../../shared/services/workspace-service/workspace.service';
import { UserMenuComponent } from '../../shared/components/pop-ups/user-menu/user-menu.component';
import { OwnProfileViewComponent } from '../../shared/components/pop-ups/own-profile-view/own-profile-view.component';
import { OwnProfileEditComponent } from '../../shared/components/pop-ups/own-profile-edit/own-profile-edit.component';
import { AddChannelComponent } from '../../shared/components/pop-ups/add-channel/add-channel.component';
import { ProfileViewComponent } from '../../shared/components/pop-ups/profile-view/profile-view.component';
import { ChooseAvatarComponent } from '../authentication/choose-avatar/choose-avatar.component';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MainWorkspaceComponent,
    LeftSideComponentComponent,
    RightSideContainerComponent,
    HeaderComponent,
    CommonModule,
    ChannelChatComponent,
    UserMenuComponent,
    OwnProfileEditComponent,
    OwnProfileViewComponent,
    AddChannelComponent,
    ChooseAvatarComponent,
    ProfileViewComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  chooseAvatarComponent: ChooseAvatarComponent;
  signupComponent: SignupComponent;

  workSpaceOpen: boolean = false;
  workspaceButtonText: string = 'Workspace-Menu öffnen';
  popUpShadowVisible: boolean = false;
  private popUpStatesSubscription!: Subscription;

  userDataSubscription!: Subscription;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    private authUIService: AuthUIService,
    private router: Router,
    private http: HttpClient
  ) {
    this.popUpShadowVisible = this.workspaceService.popUpShadowVisible();
    this.chooseAvatarComponent = new ChooseAvatarComponent(
      this.authUIService,
      this.authService,
      this.workspaceService,
      this.router,
      this.http
    );

    this.signupComponent = new SignupComponent(
      this.authUIService,
      this.authService,
      this.workspaceService
    );
  }

  ngOnInit(): void {
    // Subscribe to the user data observable to reactively update the UI
    this.userDataSubscription =
      this.workspaceService.loggedInUserData.subscribe((user) => {
        this.currentUser = user;
        if (user) {
          // console.log('User logged in:', user);
        } else {
          console.log('No user logged in');
        }
      });

    // Fetch and set the user UID once on component initialization
    this.authService.getCurrentUserUID().then((uid) => {
      this.firebaseService.setUserUID(uid);
    });
  }
  ngOnDestroy(): void {
    if (this.popUpStatesSubscription) {
      this.popUpStatesSubscription.unsubscribe();
    }

    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  toggleWorkspace() {
    this.workSpaceOpen = !this.workSpaceOpen;
    this.changeText();
  }

  changeText() {
    this.workspaceButtonText = this.workSpaceOpen
      ? 'Workspace-Menu schließen'
      : 'Workspace-Menu öffnen';
  }
}
