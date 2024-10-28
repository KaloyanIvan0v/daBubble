import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getAuth();

  constructor(private afAuth: AngularFireAuth) {}

  async login(email: string, password: string): Promise<User> {
    return signInWithEmailAndPassword(this.auth, email, password).then(
      (userCredential) => userCredential.user
    );
  }

  async register(email: string, password: string): Promise<User | void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      console.warn('Invalid email format:', email);
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return userCredential.user;
  }

  observeAuthState(callback: (user: User | null) => void): void {
    onAuthStateChanged(this.auth, callback);
  }

  async logoutUser(): Promise<void> {
    return this.afAuth.signOut();
  }

  get isAuthenticated(): Promise<boolean> {
    return this.afAuth.authState.toPromise().then((user) => !!user);
  }
}
