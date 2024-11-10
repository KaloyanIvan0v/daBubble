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
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  workSpaceOpen: boolean = false;
  workspaceButtonText: string = 'Workspace-Menu öffnen';
  popUpShadowVisible: boolean = false;
  private popUpStatesSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService
  ) {
    this.popUpShadowVisible = this.workspaceService.popUpShadowVisible();
  }

  ngOnInit(): void {
    this.authService.getCurrentUserUID().then((uid) => {
      this.firebaseService.setUserUID(uid);
    });
  }
  ngOnDestroy(): void {
    if (this.popUpStatesSubscription) {
      this.popUpStatesSubscription.unsubscribe();
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
