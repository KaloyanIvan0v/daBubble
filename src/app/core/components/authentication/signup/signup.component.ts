import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared-module';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { FirebaseServicesService } from '../../../shared/services/firebase/firebase.service';
import { Router, RouterModule } from '@angular/router';
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
    private authService: AuthService,
    private router: Router
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

  onSubmit(): void {
    this.authService
      .register(this.user.email, this.user.name, this.user.password)
      .subscribe({
        next: () => {
          this.authUIService.toggleAvatarSelection();
        },
        error: (err) => console.error('Registration error:', err),
      });
  }
}
