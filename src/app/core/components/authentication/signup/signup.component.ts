import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared-module';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { FirebaseServicesService } from '../../../shared/services/firebase/firebase.service';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  user = {
    name: '',
    email: '',
    password: '',
    avatar: '',
  };

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.observeAuthState((user) => {
      if (user) {
        console.log('Benutzer angemeldet, UID:', user.uid);
      } else {
        console.log('Benutzer abgemeldet');
      }
    });
  }

  register() {
    const { email, password, name } = this.user;

    console.log('Email before registration:', email); // Log email

    if (!email || !password || !name) {
      console.error('All fields are required.');
      return;
    }

    // Proceed to the avatar selection
    this.authUIService.toggleAvatarSelection();
  }

  finalizeRegistration() {
    const { email, password, name, avatar } = this.user;

    if (!avatar) {
      console.error('Avatar must be selected.');
      return;
    }

    this.authService
      .register(name, email, password, avatar)
      .then((user) => {
        if (user) {
          console.log('Registration successful:', user.uid);
          // Automatically log in the user after successful registration
          this.authService.login(email, password).then(() => {
            console.log('User logged in');
          });
        }
      })
      .catch((error) => {
        console.error('Registration error:', error.message);
      });
  }
}
