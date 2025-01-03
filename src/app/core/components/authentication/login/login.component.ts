import { SharedModule } from '../../../shared/shared-module';
import { FirebaseServicesService } from '../../../shared/services/firebase/firebase.service';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthUIService } from 'src/app/core/shared/services/authUI-services/authUI.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  user = {
    email: '',
    password: '',
  };

  loginError: boolean = false;

  constructor(
    public authService: AuthService,
    private firebaseService: FirebaseServicesService,
    private router: Router,
    public authUIService: AuthUIService,
    public activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {}

  async onLogin(event: Event) {
    event.preventDefault();

    if (!this.user.email || !this.user.password) {
      return; // Don't proceed if email or password is empty
    }

    try {
      const user = await this.authService.login(
        this.user.email,
        this.user.password
      );
      if (user) {
        const uid = await this.authService.getCurrentUserUID();
        this.firebaseService.setUserUID(uid);
        this.router.navigate(['/dashboard']);
        this.loginError = false;
      }
    } catch (error) {
      this.loginError = true;
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    return await this.authService.isAuthenticated;
  }

  async guestLogin(event: Event) {
    event.preventDefault();
    try {
      const user = await this.authService.login('guest1@web.de', '12345678');
      if (user) {
        const uid = await this.authService.getCurrentUserUID();
        this.firebaseService.setUserUID(uid);
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  navigateToResetPassword() {
    this.router.navigate(['/authentication/reset-password']);
  }
}
