import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from '../auth-services/auth.service';
import { FirebaseServicesService } from './../firebase/firebase.service';
import { SessionStorageService } from '../session-storage/session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private authService: AuthService = inject(AuthService);
  private firebaseService: FirebaseServicesService = inject(
    FirebaseServicesService
  );
  private sessionStorageService: SessionStorageService = inject(
    SessionStorageService
  );

  currentActiveUnitId = signal('');
  loggedInUserData = signal<any>(null);

  constructor() {
    this.loadUserData();
    effect(() => {
      if (this.authService.authStatusChanged()) {
        this.loadUserData();
      }
      this.sessionStorageService.setItem(
        'activeUnit',
        this.currentActiveUnitId()
      );
    });
    this.currentActiveUnitId.set(
      this.sessionStorageService.getItem('activeUnit') ?? ''
    );
  }

  private async loadUserData() {
    try {
      const userUID: string | null = await this.authService.getCurrentUserUID();
      if (userUID) {
        this.firebaseService.getDoc('users', userUID).subscribe({
          next: (data) => {
            this.loggedInUserData.set(data);
          },
          error: (error) => console.error('Error fetching user data:', error),
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  }
}
