import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  User,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Subscription, Observable, from } from 'rxjs';

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

  constructor(private auth: Auth) {
    // Observing the auth state and updating currentUser$ accordingly
    authState(this.auth).subscribe((user: User | null) => {
      this.currentUser$.next(user); // Emit user changes
    });
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    this.authStatusChanged.set(true);
    return userCredential.user;
  }

  register(email: string, name: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then(async (response) => {
      const user: User = response.user;
      // Update profile with display name
      await updateProfile(user, { displayName: name });

      await this.saveUserDataToFirestore(user, name, email);
    });

    return from(promise);
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

    // Save user data to Firestore
    await setDoc(doc(this.firestore, 'users', user.uid), userData);
  }

  async updateAvatar(user: User, photoURL: string): Promise<void> {
    // Update the photoURL in Firebase Auth
    await updateProfile(user, { photoURL: photoURL });

    // Also update the avatar URL in Firestore
    const userUID = user.uid;
    await setDoc(
      doc(this.firestore, 'users', userUID),
      { photoURL: photoURL },
      { merge: true }
    );

    // Emit the updated user data
    this.currentUser$.next({ ...user, photoURL }); // Emit updated user data
  }

  async logoutUser(): Promise<void> {
    this.authStatusChanged.set(false);
    return this.auth.signOut();
  }

  get isAuthenticated(): Promise<boolean> {
    return new Promise((resolve) => {
      authState(this.auth).subscribe((user: User | null) => {
        resolve(!!user);
      });
    });
  }

  getCurrentUser(): Observable<User | null> {
    return authState(this.firebaseAuth);
  }

  async getCurrentUserUID(): Promise<string | null> {
    const user = this.auth.currentUser;
    console.log('Current User:', user); // Debugging line

    return user ? user.uid : null;
  }

  observeAuthState(callback: (user: User | null) => void): Subscription {
    return authState(this.auth).subscribe(callback);
  }
}
