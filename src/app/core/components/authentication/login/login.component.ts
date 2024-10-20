import { SharedModule } from '../../../shared/shared-module';
import { FirebaseServicesService } from '../../../shared/services/firebase.service';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.login(this.user.email, this.user.password);
  }

  user = {
    email: '',
    password: '',
  };

  onLogin(event: Event) {
    event.preventDefault();
    this.authService.login(this.user.email, this.user.password);
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  guestLogin() {
    this.router.navigate(['/dashboard']);
  }

  isEmailFocused: boolean = false;
  isPasswordFocused: boolean = false;

  onFocus(inputType: string): void {
    if (inputType === 'email') {
      this.isEmailFocused = true;
    } else if (inputType === 'password') {
      this.isPasswordFocused = true;
    }
  }

  onBlur(inputType: string): void {
    if (inputType === 'email') {
      this.isEmailFocused = false;
    } else if (inputType === 'password') {
      this.isPasswordFocused = false;
    }
  }
}
