import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { environment } from 'src/app/environments/environment';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private app: FirebaseApp;
  private auth: Auth;

  constructor(private afAuth: AngularFireAuth) {
    this.app = initializeApp(environment.firebaseConfig);
    this.auth = getAuth(this.getApp());
  }

  getApp(): FirebaseApp {
    return this.app;
  }

  async login(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password).then(
      (userCredential) => userCredential.user
    );
  }

  async register(email: string, password: string): Promise<User | void> {
    // Simple regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if the email format is valid
    if (!emailRegex.test(email)) {
      console.warn('Invalid email format:', email);
      return; // Exit the method if the email format is invalid
    }

    // Proceed to create the user if the email format is valid
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return userCredential.user; // Return the user object upon successful registration
  }

  observeAuthState(callback: (user: User | null) => void): void {
    onAuthStateChanged(this.auth, callback);
  }

  logoutUser(): Promise<void> {
    return this.auth.signOut();
  }

  // isAuthenticated Getter hinzufügen
  get isAuthenticated(): boolean {
    return this.afAuth.authState !== null;
  }
}
