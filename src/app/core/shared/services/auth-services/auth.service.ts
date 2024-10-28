import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { firstValueFrom, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getAuth();
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  constructor(private afAuth: AngularFireAuth) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

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
    return firstValueFrom(this.afAuth.authState).then((user) => !!user);
  }

  async getCurrentUserUID(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }
}
