import { User } from '@angular/fire/auth';
import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from '../auth-services/auth.service';
import { FirebaseServicesService } from './../firebase/firebase.service';
import { SessionStorageService } from '../session-storage/session-storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private authService = inject(AuthService);
  private firebaseService = inject(FirebaseServicesService);
  private sessionStorageService = inject(SessionStorageService);

  currentActiveUnitId = signal('');
  currentActiveUserId = signal('123456789'); // Open UserView PopUp
  currentActiveDmUser = signal<User | null>(null);
  private activeChannelId = new BehaviorSubject<string | null>(null);

  loggedInUserData = new BehaviorSubject<User | null>(null);
  loggedInUserData$ = this.loggedInUserData.asObservable();

  activeDmUsers = signal<User[]>([]);

  popUpShadowVisible = signal(false);
  addChannelPopUp = signal(false);
  addUserToChannelPopUp = signal(false);
  channelMembersPopUp = signal(false);
  editChannelPopUp = signal(false);
  ownProfileEditPopUp = signal(false);
  ownProfileViewPopUp = signal(false);
  profileViewPopUp = signal(false);
  userMenuPopUp = signal(false);
  editAvatarPopUp = signal(false);

  private userUpdates = new BehaviorSubject<any>(null);
  userUpdates$ = this.userUpdates.asObservable();

  constructor() {
    this.initializeActiveUnit();
    this.subscribeToUserStateChanges();
    this.setupAuthEffect();
    this.loadUserData();
  }

  setActiveChannelId(channelId: string): void {
    this.activeChannelId.next(channelId);
  }

  getActiveChannelId(): Observable<string | null> {
    return this.activeChannelId.asObservable();
  }

  updateUser(user: any) {
    this.userUpdates.next(user);
  }

  setPopUp(popUpSignal: any, visible: boolean) {
    popUpSignal.set(visible);
  }

  setActiveDmUser(dmUser: User) {
    this.currentActiveDmUser.set(dmUser);
  }

  getCurrentActiveDmUser(): User | null {
    return this.currentActiveDmUser();
  }

  updateLoggedInUserData(userData: any) {
    this.loggedInUserData.next(userData);
  }

  private initializeActiveUnit() {
    const activeUnit = this.sessionStorageService.getItem('activeUnit') ?? '';
    this.currentActiveUnitId.set(activeUnit as string);
  }

  private subscribeToUserStateChanges() {
    this.authService.userStateChanged.subscribe(() => {
      this.loadUserData();
    });
  }

  private setupAuthEffect() {
    effect(() => {
      if (this.authService.authStatusChanged()) {
        this.loadUserData();
      }
      this.sessionStorageService.setItem(
        'activeUnit',
        this.currentActiveUnitId()
      );
    });
  }

  private async loadUserData() {
    try {
      const userUID = await this.authService.getCurrentUserUID();
      if (userUID) {
        this.fetchUserData(userUID);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }

  private fetchUserData(userUID: string) {
    this.firebaseService.getDoc('users', userUID).subscribe({
      next: (data: any) => this.handleUserData(data),
      error: (error) => console.error('Error fetching user data:', error),
    });
  }

  private handleUserData(data: any) {
    if (data) {
      this.loggedInUserData.next({ ...data, avatar: data.avatar });
    }
  }
}
