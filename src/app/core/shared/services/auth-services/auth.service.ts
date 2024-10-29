// auth.service.ts
import { Injectable } from '@angular/core';
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

  constructor(private auth: Auth) {
    this.currentUser$ = authState(this.auth);
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    return userCredential.user;
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

  async logoutUser(): Promise<void> {
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
