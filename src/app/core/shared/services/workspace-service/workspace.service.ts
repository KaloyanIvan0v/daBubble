import { UserMenuComponent } from './../../components/pop-ups/user-menu/user-menu.component';
import { AddChannelComponent } from './../../components/pop-ups/add-channel/add-channel.component';
import { EditChannelComponent } from './../../components/pop-ups/edit-channel/edit-channel.component';
import { Injectable, inject, signal, effect, Signal } from '@angular/core';
import { AuthService } from '../auth-services/auth.service';
import { FirebaseServicesService } from './../firebase/firebase.service';
import { SessionStorageService } from '../session-storage/session-storage.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private authService: AuthService = inject(AuthService);
  private firebaseService: FirebaseServicesService = inject(
    FirebaseServicesService
  );
  private sessionStorageService: SessionStorageService = inject(
    SessionStorageService
  );

  currentActiveUnitId = signal('');
  loggedInUserData = new BehaviorSubject<any>(null);
  loggedInUserData$ = this.loggedInUserData.asObservable();
  popUpShadowVisible = signal(false);
  addChannelPopUp = signal(false);
  addUserToChannelPopUp = signal(false);
  channelMembersPopUp = signal(false);
  editChannelPopUp = signal(false);
  ownProfileEditPopUp = signal(false);
  ownProfileViewPopUp = signal(false);
  profileViewPopUp = signal(false);
  userMenuPopUp = signal(false);

  constructor() {
    this.loadUserData();
    effect(() => {
      if (this.authService.authStatusChanged()) {
        this.loadUserData();
      }
      this.sessionStorageService.setItem(
        'activeUnit',
        this.currentActiveUnitId()
      );
    });
    this.currentActiveUnitId.set(
      this.sessionStorageService.getItem('activeUnit') ?? ''
    );
  }

  setPopUp(popUpName: any, visible: boolean) {
    popUpName.set(visible);
  }

  private async loadUserData() {
    try {
      const userUID: string | null = await this.authService.getCurrentUserUID();
      if (userUID) {
        this.firebaseService.getDoc('users', userUID).subscribe({
          next: (data: any) => {
            this.loggedInUserData.next(data);

            if (data && data.avatar) {
              this.loggedInUserData.next({ ...data, avatar: data.avatar });
            }
          },
          error: (error) => console.error('Error fetching user data:', error),
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }

  updateLoggedInUserData(userData: any) {
    this.loggedInUserData.next(userData);
  }
}
