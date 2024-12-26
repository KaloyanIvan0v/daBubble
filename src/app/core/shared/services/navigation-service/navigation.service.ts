import { Injectable } from '@angular/core';
import { FirebaseServicesService } from '../firebase/firebase.service';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(
    private firebaseService: FirebaseServicesService,
    private router: Router
  ) {}

  loadChannels(): void {
    this.firebaseService
      .getChannels()
      .pipe(takeUntil(this.destroy$))
      .subscribe((channels) => {
        this.channels = channels;
      });
  }

  loadChats(): void {
    this.firebaseService
      .getChats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((chats) => {
        this.chats = chats;
      });
  }

  navigateTo(space: string): void {
    this.router.navigate(['dashboard', space]);
  }

  chatExists(userUid: string): boolean {
    return this.chats.find((chat: any) => chat.receiver.uid.includes(userUid));
  }
}
