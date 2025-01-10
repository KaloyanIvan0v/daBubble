import { RightSideContainerComponent } from './../../../components/main/right-side-container/right-side-container.component';
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  User,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { GoogleAuthProvider } from 'firebase/auth';
import { BehaviorSubject, Subscription, Observable, from, Subject } from 'rxjs';
import { AuthUIService } from '../authUI-services/authUI.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  firestore = inject(Firestore);
  currentUser$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(
    null
  );
  authStatusChanged = signal<boolean>(false);
  userStateChanged = new Subject<void>();
  private nextSubject = new Subject<any>();

  provider = new GoogleAuthProvider();
  private popupOpen = false;
  constructor(
    private auth: Auth,
    public authUIService: AuthUIService,
    private router: Router,
    public activatedRoute: ActivatedRoute,
    private StatefulWindowServiceService: StatefulWindowServiceService
  ) {
    this.initAuthState();

    this.getAuthState().subscribe((user: User | null) => {
      const uid = user ? user.uid : null;
      this.nextSubject.next(uid);
    });
  }

  /**
   * Initializes the auth state of the user by setting the current user on the
   * currentUser$ subject. This is done by subscribing to the authState observable
   * provided by the Angular Fire Auth SDK.
   */
  private initAuthState(): void {
    authState(this.auth).subscribe((user: User | null) => {
      this.currentUser$.next(user);
    });
  }

  /**
   * Saves the user data to the Firestore database after a successful user
   * registration. The user data is stored in a document with the user's UID as
   * the document ID in the 'users' collection. The data includes the user's name,
   * email, photo URL, an empty array of contacts, and the user's status set to
   * true.
   * @param user The User object returned from the Angular Fire Auth SDK.
   * @param name The user's name provided during registration.
   * @param email The user's email provided during registration.
   */
  private async saveUserDataToFirestore(
    user: User,
    name: string,
    email: string
  ): Promise<void> {
    const userData = {
      uid: user.uid,
      name: name,
      email: email,
      photoURL: user.photoURL || '',
      contacts: [],
      status: true,
    };

    await setDoc(doc(this.firestore, 'users', user.uid), userData);
  }

  /**
   * Logs in a user using their email and password.
   * @param email The email address of the user to log in.
   * @param password The password of the user to log in.
   * @returns A promise of the User object of the logged in user.
   */
  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    this.currentUser$.next(userCredential.user);
    this.authStatusChanged.set(true);
    this.userStateChanged.next();
    return userCredential.user;
  }

  /**
   * Registers a new user using their email, name, and password.
   * The registration process involves creating a new user in the Firebase
   * Authentication system and saving the user data to the Firestore database.
   * @param email The email address of the user to register.
   * @param name The name of the user to register.
   * @param password The password of the user to register.
   * @returns An observable that resolves when the registration process is complete.
   */
  register(email: string, name: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((response) =>
      this.handleUserRegistration(response.user, name, email)
    );

    return from(promise);
  }

  /**
   * Handles the user registration process after a successful user creation.
   * Updates the user's profile with the provided name and saves the user data
   * to the Firestore database. Finally, it updates the user state.
   * @param user The User object returned from the Firebase Authentication system.
   * @param name The name of the user to register.
   * @param email The email address of the user to register.
   */
  private async handleUserRegistration(
    user: User,
    name: string,
    email: string
  ): Promise<void> {
    await updateProfile(user, { displayName: name });
    await this.saveUserDataToFirestore(user, name, email);
    this.updateUserState(user);
  }

  /**
   * Updates the user state by setting the current user on the currentUser$ subject and
   * notifying any subscribers of the userStateChanged observable.
   * @param user The User object to update the state with.
   */
  private updateUserState(user: User): void {
    this.currentUser$.next(user);
    this.userStateChanged.next();
  }

  /**
   * Handles the Google sign-in process. It first configures the Google provider,
   * then uses the signInWithPopup function from the Firebase Authentication
   * system to sign the user in. After a successful sign-in, it calls the
   * handleGoogleSignInResult method to handle the sign-in result.
   * If an error occurs during the sign-in process, it logs the error to the
   * console.
   */
  async googleSignIn(): Promise<void> {
    const provider = this.configureGoogleProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;
      await this.handleGoogleSignInResult(user, result);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }

  /**
   * Configures and returns a GoogleAuthProvider instance for Google sign-in.
   * Sets custom parameters to prompt the user to select an account during sign-in.
   *
   * @returns {GoogleAuthProvider} The configured GoogleAuthProvider instance.
   */
  private configureGoogleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }

  /**
   * Handles the result of a Google sign-in attempt. Determines if the user is new
   * or existing by checking the sign-in result. For new users, it processes their
   * registration and navigates to the avatar selection page. For existing users,
   * it navigates to the dashboard. Updates the current user state at the end.
   *
   * @param user The User object returned from the Google sign-in process.
   * @param result The result object from the Google sign-in process, containing
   * additional user information.
   * @returns A promise that resolves when the sign-in result has been fully handled.
   */

  private async handleGoogleSignInResult(
    user: User,
    result: any
  ): Promise<void> {
    const isNewUser = this.isNewUser(result);
    if (isNewUser) {
      await this.handleNewUser(user);
    } else {
      this.handleExistingUser();
    }
    this.currentUser$.next(user);
  }

  /**
   * Determines if the user is new or existing by checking the sign-in result.
   * A new user is defined as a user who has just signed in for the first time
   * using the Google sign-in provider. The isNewUser property is set by the
   * Firebase Authentication system on the result object returned by the
   * signInWithPopup function.
   *
   * @param result The result object returned by the signInWithPopup function.
   * @returns True if the user is new, otherwise false.
   */
  private isNewUser(result: any): boolean {
    return getAdditionalUserInfo(result)?.isNewUser ?? false;
  }

  /**
   * Handles the registration process for a new user who has signed in for the first time using
   * the Google sign-in provider. Saves the user's data to the Firestore database and navigates
   * to the avatar selection page.
   *
   * @param user The User object returned from the Google sign-in process.
   * @returns A promise that resolves when the registration process has been fully handled.
   */
  private async handleNewUser(user: User): Promise<void> {
    if (user.email) {
      await this.saveUserDataToFirestore(
        user,
        user.displayName || '',
        user.email
      );
      this.userStateChanged.next();
      await this.router.navigate(['/authentication/choose-avatar']);
    }
  }

  /**
   * Handles the sign-in process for an existing user who has signed in using
   * the Google sign-in provider. Navigates to the dashboard.
   */
  private handleExistingUser(): void {
    this.userStateChanged.next();
    this.router.navigate(['/dashboard']);
  }

  /**
   * Updates the avatar for the given user by setting the new photo URL.
   * This involves updating the user's profile with the new photo URL and
   * saving the updated photo URL to the Firestore database.
   *
   * @param user The User object whose avatar is to be updated.
   * @param photoURL The new photo URL for the user's avatar.
   * @returns A promise that resolves when the avatar update is complete.
   */

  async updateAvatar(user: User, photoURL: string): Promise<void> {
    await updateProfile(user, { photoURL: photoURL });
    const userUID = user.uid;
    await setDoc(
      doc(this.firestore, 'users', userUID),
      { photoURL: photoURL },
      { merge: true }
    );
  }

  /**
   * Logs out the current user by setting the authentication status to false,
   * setting the current user to null, signing out of the authentication provider,
   * navigating to the login page, and hiding the right side component.
   * @returns A promise that resolves when the logout operation is complete.
   */
  async logoutUser(): Promise<void> {
    this.authStatusChanged.set(false);
    this.currentUser$.next(null);
    await this.auth.signOut();
    this.router.navigate(['authentication', 'login']);
    this.StatefulWindowServiceService.rightSideComponentState.set(false);
  }

  /**
   * Resets the password for the user with the given email address by sending a
   * password reset email to the user. The user is then responsible for following
   * the link in the email to reset their password.
   *
   * @param email The email address of the user to reset the password for.
   * @returns A promise that resolves when the password reset email is sent
   * successfully. If the email address does not exist or the email cannot be
   * sent, the promise rejects with the error that occurred.
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Determines if a user is currently authenticated.
   * Subscribes to the authentication state and resolves a promise
   * with a boolean value indicating the authentication status.
   *
   * @returns A promise that resolves to true if the user is authenticated,
   * false otherwise.
   */

  get isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      authState(this.auth).subscribe((user: User | null) => {
        resolve(!!user);
      });
    });
  }

  /**
   * Observes the authentication state and returns an observable that emits a boolean
   * value indicating whether the user is authenticated or not.
   *
   * @returns An observable that emits true if the user is authenticated, false otherwise.
   */
  get isAuthenticated$(): Observable<boolean> {
    return authState(this.auth).pipe(map((user) => !!user));
  }

  /**
   * Observes the authentication state and returns an observable that emits the current user or null
   * if the user is not authenticated.
   *
   * @returns An observable that emits the current user or null if the user is not authenticated.
   */
  getCurrentUser(): Observable<User | null> {
    return authState(this.firebaseAuth);
  }

  /**
   * Returns a promise that resolves to the current user's UID or null if the user is not signed in.
   * @returns A promise that resolves to the current user's UID or null if the user is not signed in.
   */
  async getCurrentUserUID(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  /**
   * Observes the authentication state and calls the given callback with the current user
   * or null if the user is not authenticated.
   *
   * @param callback A callback that is called with the current user or null if the user is not authenticated.
   * @returns A subscription that can be used to unsubscribe from the observable.
   */
  observeAuthState(callback: (user: User | null) => void): Subscription {
    return authState(this.auth).subscribe(callback);
  }

  /**
   * Returns an observable that emits the current user or null if the user is not authenticated.
   * The observable is a direct stream of the authentication state provided by the Angular Fire Auth SDK.
   *
   * @returns An observable that emits the current user or null if the user is not authenticated.
   */
  getAuthState(): Observable<User | null> {
    return authState(this.auth);
  }
}
