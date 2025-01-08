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
  currentActiveUserId = signal('123456789');
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
  mobileUserMenuPopUp = signal(false);
  editAvatarPopUp = signal(false);

  private userUpdates = new BehaviorSubject<any>(null);
  userUpdates$ = this.userUpdates.asObservable();

  constructor() {
    this.initializeActiveUnit();
    this.subscribeToUserStateChanges();
    this.setupAuthEffect();
    this.loadUserData();
  }

  /**
   * Sets the active channel ID.
   * Triggers a new value on the activeChannelId observable.
   * @param channelId The ID of the channel to be set as the active channel.
   */
  setActiveChannelId(channelId: string): void {
    this.activeChannelId.next(channelId);
  }

  /**
   * Retrieves an observable of the active channel ID.
   *
   * @returns An observable that emits the current active channel ID or null if no channel is active.
   */

  getActiveChannelId(): Observable<string | null> {
    return this.activeChannelId.asObservable();
  }

  /**
   * Emits a new value on the userUpdates observable with the provided user data.
   * @param user The user data to be emitted on the userUpdates observable.
   */
  updateUser(user: any) {
    this.userUpdates.next(user);
  }

  /**
   * Sets the visibility state of a popup.
   *
   * @param popUpSignal The signal representing the popup's visibility state.
   * @param visible A boolean indicating whether the popup should be shown (true) or hidden (false).
   */

  setPopUp(popUpSignal: any, visible: boolean) {
    popUpSignal.set(visible);
  }

  /**
   * Sets the currently active DM user.
   * Triggers a new value on the activeDmUsers observable.
   * @param dmUser The user data of the DM user to be set as the active DM user.
   */
  setActiveDmUser(dmUser: User) {
    this.currentActiveDmUser.set(dmUser);
  }

  /**
   * Retrieves the currently active DM user.
   * @returns The currently active DM user or null if no DM user is active.
   */
  getCurrentActiveDmUser(): User | null {
    return this.currentActiveDmUser();
  }

  /**
   * Updates the logged-in user data by emitting a new value on the loggedInUserData observable.
   * @param userData The user data to be emitted on the loggedInUserData observable.
   */
  updateLoggedInUserData(userData: any) {
    this.loggedInUserData.next(userData);
  }

  /**
   * Initializes the currently active unit ID by retrieving it from session storage.
   * If no value is stored in session storage, it defaults to an empty string.
   * The active unit ID is then set on the currentActiveUnitId signal.
   */
  private initializeActiveUnit() {
    const activeUnit = this.sessionStorageService.getItem('activeUnit') ?? '';
    this.currentActiveUnitId.set(activeUnit as string);
  }

  /**
   * Subscribes to changes in the user's authentication state.
   * When the user state changes, it triggers the loading of user data.
   */

  private subscribeToUserStateChanges() {
    this.authService.userStateChanged.subscribe(() => {
      this.loadUserData();
    });
  }

  /**
   * Sets up an effect that runs whenever the authentication state changes.
   * When the authentication state changes, the user data is reloaded.
   * Additionally, the currently active unit ID is stored in session storage.
   */
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

  /**
   * Retrieves user data from Firestore given a user UID.
   * Subscribes to the provided user UID and fetches the associated user data.
   * When the user data is retrieved, it calls the handleUserData method to
   * emit the user data on the loggedInUserData observable.
   * @param userUID The UID of the user whose data is to be fetched.
   */
  private fetchUserData(userUID: string) {
    this.firebaseService.getDoc('users', userUID).subscribe({
      next: (data: any) => this.handleUserData(data),
      error: (error) => console.error('Error fetching user data:', error),
    });
  }

  /**
   * Handles the user data received from Firestore.
   * Emits the user data on the loggedInUserData observable if the data is not null or undefined.
   * @param data The user data received from Firestore.
   */
  private handleUserData(data: any) {
    if (data) {
      this.loggedInUserData.next({ ...data, avatar: data.avatar });
    }
  }
}
