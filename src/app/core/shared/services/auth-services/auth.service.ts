import { Injectable, signal } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import {
  Auth,
  User,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@angular/fire/auth';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser$: BehaviorSubject<User | null>;
  authStatusChanged = signal<boolean>(false);

  constructor(private auth: Auth, private firestore: Firestore) {
    // Observing the auth state and updating currentUser$ accordingly
    this.currentUser$ = authState(this.auth);
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      this.authStatusChanged.set(true);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Rethrow the error for handling in the component
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    imgPath: string
  ): Promise<User | void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store user data in Firestore
      await setDoc(doc(this.firestore, 'users', user.uid), {
        name: name,
        email: email,
        imgPath: imgPath,
      });

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Rethrow the error for handling in the component
    }
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

  async getCurrentUserUID(): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.uid : null;
  }

  observeAuthState(callback: (user: User | null) => void): Subscription {
    return authState(this.auth).subscribe(callback);
  }
}
