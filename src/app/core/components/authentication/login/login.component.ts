import { SharedModule } from '../../../shared/shared-module';
import { FirebaseServicesService } from '../../../shared/services/firebase/firebase.service';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-services/auth.service';
import { Router } from '@angular/router';
import { AuthUIService } from 'src/app/core/shared/services/authUI-services/authUI.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'], // Changed to styleUrls
})
export class LoginComponent implements OnInit {
  user = {
    email: '',
    password: '',
  };

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService,
    private router: Router,
    public authUIService: AuthUIService
  ) {}

  ngOnInit(): void {
    // Moved login call to onLogin method to control execution
  }

  async onLogin(event: Event) {
    event.preventDefault();
    try {
      const user = await this.authService.login(
        this.user.email,
        this.user.password
      );
      if (user) {
        this.firebaseService.userUID =
          await this.authService.getCurrentUserUID();
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    return await this.authService.isAuthenticated;
  }

  guestLogin() {
    this.router.navigate(['/dashboard']);
  }
}
