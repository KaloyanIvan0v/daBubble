import { Component } from '@angular/core';
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
export class SignupComponent {
  user = {
    name: '',
    email: '',
    password: '',
    photoURL: 'assets/img/profile-img/profile-img-placeholder.svg',
  };

  userData$: Observable<any>;

  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    public workspaceService: WorkspaceService
  ) {
    // Assign the Observable from the service
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  ngOnInit() {
    this.authService.observeAuthState((user) => {
      if (user) {
        console.log('User logged in, UID:', user.uid);
      } else {
        console.log('User logged out');
      }
    });

    // Ensure that the user is only registered after form submission
    this.authService.observeAuthState((user) => {
      if (user && !this.user.name) {
        console.log(
          'User is logged in automatically without submitting the form'
        );
      }
    });
  }

  onSubmit(): void {
    this.authService
      .register(this.user.email, this.user.name, this.user.password)
      .subscribe({
        next: (registeredUser) => {
          // Update the user data in the workspace service
          this.workspaceService.updateLoggedInUserData(registeredUser);
          // Proceed with the next steps
          this.authUIService.toggleAvatarSelection();
        },
        error: (err) => console.error('Registration error:', err),
      });
  }
}
