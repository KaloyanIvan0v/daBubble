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
}
