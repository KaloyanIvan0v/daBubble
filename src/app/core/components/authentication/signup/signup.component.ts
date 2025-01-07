import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared-module';
import { Observable } from 'rxjs';
import { AuthUIService } from '../../../shared/services/authUI-services/authUI.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
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
    public workspaceService: WorkspaceService,
    public router: Router,
    public activatedRoute: ActivatedRoute
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  ngOnInit() {
    this.authService.observeAuthState((user) => {
      if (user) {
        console.log('User logged in, UID:', user.uid);
      } else {
        console.log('No user logged in');
      }
    });
  }

  /**
   * Handles the registration process. If the registration is successful, it navigates
   * the user to the 'choose-avatar' page. If the registration fails, it sets the
   * isEmailAlreadyUsed flag to true if the error is 'auth/email-already-in-use'.
   */
  onSubmit(): void {
    this.authService
      .register(this.user.email, this.user.name, this.user.password)
      .subscribe({
        next: (registeredUser) =>
          this.handleSuccessfulRegistration(registeredUser),
        error: (err) => this.handleRegistrationError(err),
      });
  }

  private handleSuccessfulRegistration(registeredUser: any): void {
    this.isEmailAlreadyUsed = false;
    this.workspaceService.updateLoggedInUserData(registeredUser);
    this.navigateToChooseAvatar();
  }

  private handleRegistrationError(err: any): void {
    if (err.code === 'auth/email-already-in-use') {
      this.isEmailAlreadyUsed = true;
    }
  }

  checkEmailAlreadyUsed(email: string): void {
    if (email) {
      this.isEmailAlreadyUsed = false;
    }
  }

  navigateToLogin() {
    this.router.navigate(['/authentication/login']);
  }

  navigateToChooseAvatar() {
    this.router.navigate(['choose-avatar'], {
      relativeTo: this.activatedRoute.parent,
    });
  }
}
