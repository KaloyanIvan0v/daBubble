import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './core/shared/services/auth-services/auth.service';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    return this.authService.currentUser$.pipe(
      map((user) => !!user),
      tap((isLoggedIn) => {
        if (!isLoggedIn) {
          console.log('Kein Login, Umleitung zur Login-Seite');
          this.router.navigate(['/app-login']);
        }
      })
    );
  }
}
