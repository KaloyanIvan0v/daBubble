import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-module';
import { Observable } from 'rxjs';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'], // Corrected 'styleUrl' to 'styleUrls'
})
export class SignupComponent implements OnInit {
  user = {
    name: '',
    email: '',
    password: '',
    photoURL: '',
  };

  userData$: Observable<any>;

  isEmailAlreadyUsed = false;

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    public workspaceService: WorkspaceService
  ) {
    // Assign the Observable from the service
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  ngOnInit() {
    // Subscribe to currentUser$ for real-time updates on auth state
    this.authService.observeAuthState((user) => {
      if (user) {
        console.log('User logged in, UID:', user.uid);
      } else {
        console.log('No user logged in');
      }
    });
  }

  onSubmit(): void {
    this.authService
      .register(this.user.email, this.user.name, this.user.password)
      .subscribe({
        next: (registeredUser) => {
          this.isEmailAlreadyUsed = false;

          this.workspaceService.updateLoggedInUserData(registeredUser);

          this.authUIService.toggleAvatarSelection();
        },
        error: (err) => {
          if (err.code === 'auth/email-already-in-use') {
            this.isEmailAlreadyUsed = true;
          }
        },
      });
  }

  checkEmailAlreadyUsed(email: string): void {
    if (email) {
      this.isEmailAlreadyUsed = false;
    }
  }
}
