import { OwnProfileEditComponent } from './../own-profile-edit/own-profile-edit.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../services/auth-services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  constructor(public authService: AuthService, private router: Router) {}

  logOut() {
    this.authService.logoutUser().then(() => {
      this.router.navigate(['app-authentication']);
    });
  }

  openProfilePopUp() {}
}
