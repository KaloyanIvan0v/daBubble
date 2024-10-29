import { OwnProfileEditComponent } from './../own-profile-edit/own-profile-edit.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../services/pop-up-service/global-data.service';
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
  constructor(
    public globalDataService: GlobalDataService,
    public authService: AuthService,
    private router: Router
  ) {}

  logOut() {
    this.authService.logoutUser().then(() => {
      this.globalDataService.closePopUp();
      this.router.navigate(['']);
    });
  }

  openProfilePopUp() {
    this.globalDataService.closePopUp();
    this.globalDataService.openPopUp('ownProfileView');
  }
}
