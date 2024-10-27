import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { Observable } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from '../signup/signup.component';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { ChooseAvatarComponent } from '../choose-avatar/choose-avatar.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    SignupComponent,
    ChooseAvatarComponent,
    ResetPasswordComponent,
  ],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
  providers: [JsonPipe],
})
export class AuthenticationComponent {
  removeLoginAnimation = false;
  removeAnimationText = false;
  showLogo = false;
  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService
  ) {
    this.users = this.firebaseService.getCollection('users');
  }

  users: Observable<any[]>;

  // ngOnInit(): void {
  //   console.log('daten:', this.users);
  //   console.log('test');
  // }

  ngOnInit(): void {
    this.users.subscribe((data) => {
      console.log('Daten:', data);
    });

    setTimeout(() => {
      this.removeLoginAnimation = true;
      this.showLogo = true;
    }, 1350);
  }
}
