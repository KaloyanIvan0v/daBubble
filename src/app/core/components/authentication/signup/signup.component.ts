import { Component, signal } from '@angular/core';
import { SharedModule } from '../../../shared/shared-module';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { FirebaseServicesService } from '../../../shared/services/firebase/firebase.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

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
    photoURL: '',
  };

  userData = signal<any>(null);

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    public workspaceService: WorkspaceService,
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
          this.workspaceService.loggedInUserData = this.userData;
          this.authUIService.toggleAvatarSelection();
        },
        error: (err) => console.error('Registration error:', err),
      });
  }
}
