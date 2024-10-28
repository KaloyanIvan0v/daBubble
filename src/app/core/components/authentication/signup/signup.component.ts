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
  };
  constructor(
    // private firebaseService: FirebaseServicesService,
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

    // Registriere den Benutzer mit Email und Passwort
    this.authService
      .register(email, password)
      .then((user) => {
        // Optional: Benutzername separat speichern, z.B. in Firestore
        // this.firebaseService.saveUserProfile(user.uid, { name, email });
      })
      .catch((error) => {
        console.error('Fehler bei der Registrierung:', error.message);
      });
  }
}
