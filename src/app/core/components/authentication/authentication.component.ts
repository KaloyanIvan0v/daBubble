import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from '../../shared/services/firebase.service';
import { Observable } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from '../signup/signup.component';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { ChooseAvatarComponent } from '../choose-avatar/choose-avatar.component';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    SignupComponent,
    ChooseAvatarComponent,
  ],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
  providers: [JsonPipe],
})
export class AuthenticationComponent {
  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService
  ) {
    this.users = this.firebaseService.getRealtimeCollectionData('users');
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
  }
}
