import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainWorkspaceComponent } from './main-workspace/main-workspace.component';
import { LeftSideComponentComponent } from './left-side-component/left-side-component.component';
import { RightSideContainerComponent } from './right-side-container/right-side-container.component';
import { HeaderComponent } from './header/header.component';
import { AddChannelComponent } from '../../shared/components/pop-ups/add-channel/add-channel.component';
import { AddUserToChannelComponent } from '../../shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { EditChannelComponent } from '../../shared/components/pop-ups/edit-channel/edit-channel.component';
import { OwnProfileEditComponent } from '../../shared/components/pop-ups/own-profile-edit/own-profile-edit.component';
import { OwnProfileViewComponent } from '../../shared/components/pop-ups/own-profile-view/own-profile-view.component';
import { ProfileViewComponent } from '../../shared/components/pop-ups/profile-view/profile-view.component';
import { UserMenuComponent } from '../../shared/components/pop-ups/user-menu/user-menu.component';
import { GlobalDataService } from '../../shared/services/pop-up-service/global-data.service';
import { PopUpComponent } from '../../shared/components/pop-up/pop-up.component';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth-services/auth.service';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MainWorkspaceComponent,
    LeftSideComponentComponent,
    RightSideContainerComponent,
    HeaderComponent,
    CommonModule,
    AddChannelComponent,
    PopUpComponent,
    AddUserToChannelComponent,
    EditChannelComponent,
    OwnProfileEditComponent,
    OwnProfileViewComponent,
    ProfileViewComponent,
    UserMenuComponent,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  workSpaceOpen: boolean = false;
  workspaceButtonText: string = 'Workspace-Menu öffnen';
  addChannelVisible: boolean = false;
  addUserToChannelVisible: boolean = false;
  editChannelVisible: boolean = false;
  ownProfileEditVisible: boolean = false;
  ownProfileViewVisible: boolean = false;
  profileViewVisible: boolean = false;
  userMenuVisible: boolean = false;

  popUpStates: { [key: string]: boolean } = {};

  private popUpStatesSubscription!: Subscription;

  constructor(
    private globalDataService: GlobalDataService,
    private authService: AuthService,
    private firebaseService: FirebaseServicesService
  ) {}

  ngOnInit(): void {
    this.popUpStatesSubscription =
      this.globalDataService.popUpStates$.subscribe((states) => {
        this.popUpStates = states as { [key: string]: boolean };
      });
    this.getUID();
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

  // Example methods to open and close pop-ups
  openAddChannelPopUp() {
    this.globalDataService.openPopUp('addChannel');
  }

  closeAddChannelPopUp() {
    this.globalDataService.closePopUp();
  }

  async getUID() {
    this.firebaseService.userUID = await this.authService.getCurrentUserUID();
  }
}
