import { FirebaseServicesService } from './../../../shared/services/firebase.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth-services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, MatIconModule],
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
}
