import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from '../auth-services/auth.service';
import { FirebaseServicesService } from './../firebase/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private authService: AuthService = inject(AuthService);
  private firebaseService: FirebaseServicesService = inject(
    FirebaseServicesService
  );

  currentActiveUnitId = signal('');
  loggedInUserData = signal<any>(null);

  constructor() {
    this.loadUserData();
    effect(() => {
      if (this.authService.authStatusChanged()) {
        this.loadUserData();
      }
    });
  }

  private async loadUserData() {
    try {
      const userUID: string | null = await this.authService.getCurrentUserUID();
      console.log('userUID', userUID);
      if (userUID) {
        this.firebaseService.getDoc('users', userUID).subscribe({
          next: (data) => {
            this.loggedInUserData.set(data);
            console.log('Aktueller user:', this.loggedInUserData());
          },
          error: (error) => console.error('Error fetching user data:', error),
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }
}
