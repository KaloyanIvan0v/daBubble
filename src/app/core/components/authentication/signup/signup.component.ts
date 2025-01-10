import { Component } from '@angular/core';
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
export class SignupComponent {
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

  /**
   * Handles the successful registration process. It resets the
   * isEmailAlreadyUsed flag, updates the logged in user data, and navigates
   * to the 'choose-avatar' page.
   *
   * @param registeredUser The registered user data that was returned
   * from the registration process.
   */
  private handleSuccessfulRegistration(registeredUser: any): void {
    this.isEmailAlreadyUsed = false;
    this.workspaceService.updateLoggedInUserData(registeredUser);
    this.navigateToChooseAvatar();
  }

  /**
   * Handles the registration error. If the error is 'auth/email-already-in-use',
   * it sets the isEmailAlreadyUsed flag to true.
   *
   * @param err The error that was returned from the registration process.
   */
  private handleRegistrationError(err: any): void {
    if (err.code === 'auth/email-already-in-use') {
      this.isEmailAlreadyUsed = true;
    }
  }

  /**
   * Checks if the given email is already used.
   * If the email is valid, it resets the isEmailAlreadyUsed flag to false.
   * @param email The email to check.
   */
  checkEmailAlreadyUsed(email: string): void {
    if (email) {
      this.isEmailAlreadyUsed = false;
    }
  }

  /**
   * Checks if the entered email has an invalid format.
   */
  isEmailInvalid() {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return this.user.email && !emailRegex.test(this.user.email);
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
