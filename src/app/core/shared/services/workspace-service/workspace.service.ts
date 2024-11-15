import { User } from '@angular/fire/auth';
import { Injectable, inject, signal, effect } from '@angular/core';
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
  currentActiveUserId = signal('123456789'); //open UserView PopUp

  loggedInUserData = new BehaviorSubject<User | null>(null);
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
  changeAvatarPopUp = signal(false);

  private userUpdates = new BehaviorSubject<any>(null);
  userUpdates$ = this.userUpdates.asObservable();

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

    this.authService.userStateChanged.subscribe(() => {
      this.loadUserData(); // Trigger data reload
    });
  }

  updateUser(user: any) {
    this.userUpdates.next(user);
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
