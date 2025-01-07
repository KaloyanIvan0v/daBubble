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

  private initAuthState(): void {
    authState(this.auth).subscribe((user: User | null) => {
      this.currentUser$.next(user);
    });
  }

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

  private async handleUserRegistration(
    user: User,
    name: string,
    email: string
  ): Promise<void> {
    await updateProfile(user, { displayName: name });
    await this.saveUserDataToFirestore(user, name, email);
    this.updateUserState(user);
  }

  private updateUserState(user: User): void {
    this.currentUser$.next(user);
    this.userStateChanged.next();
  }

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

  private configureGoogleProvider(): GoogleAuthProvider {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }

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

  private isNewUser(result: any): boolean {
    return getAdditionalUserInfo(result)?.isNewUser ?? false;
  }

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

  private handleExistingUser(): void {
    this.userStateChanged.next();
    this.router.navigate(['/dashboard']);
  }

  async updateAvatar(user: User, photoURL: string): Promise<void> {
    await updateProfile(user, { photoURL: photoURL });
    const userUID = user.uid;
    await setDoc(
      doc(this.firestore, 'users', userUID),
      { photoURL: photoURL },
      { merge: true }
    );
  }

  async logoutUser(): Promise<void> {
    this.authStatusChanged.set(false);
    this.currentUser$.next(null);
    await this.auth.signOut();
    this.router.navigate(['authentication', 'login']);
    this.StatefulWindowServiceService.rightSideComponentState.set(false);
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      console.log('Password reset email sent');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  get isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      authState(this.auth).subscribe((user: User | null) => {
        resolve(!!user);
      });
    });
  }

  get isAuthenticated$(): Observable<boolean> {
    return authState(this.auth).pipe(map((user) => !!user));
  }

  getCurrentUser(): Observable<User | null> {
    return authState(this.firebaseAuth);
  }

  async getCurrentUserUID(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  observeAuthState(callback: (user: User | null) => void): Subscription {
    return authState(this.auth).subscribe(callback);
  }

  getAuthState(): Observable<User | null> {
    return authState(this.auth);
  }
}
