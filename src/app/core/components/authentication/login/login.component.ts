import { FirebaseServicesService } from './../../../shared/services/firebase.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../shared/services/auth-services/auth.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseServicesService
  ) {}

  ngOnInit(): void {
    this.authService.login(this.user.email, this.user.password);
  }

  user = {
    email: '',
    password: '',
  };

  onLogin(event: Event) {
    event.preventDefault(); // Prevent the default form submission behavior
    this.authService.login(this.user.email, this.user.password); // Call the login function
  }

  // Status überprüfen
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }
}
