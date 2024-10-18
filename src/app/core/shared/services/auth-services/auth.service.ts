import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth) {}
  signUp(email: string, password: string) {
    this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        // Sign up successful
      })
      .catch((error) => {
        // An error occurred
      });
  }

  login(email: string, password: string): Promise<any> {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        // Login successful
        return result;
      })
      .catch((error) => {
        // An error occurred
        throw error;
      });
  }

  logout(email: string, password: string) {
    this.afAuth
      .signOut()
      .then(() => {
        // Logout successful
      })
      .catch((error) => {
        // An error occurred
      });
  }

  get isAuthenticated(): boolean {
    return this.afAuth.currentUser !== null;
  }
}
