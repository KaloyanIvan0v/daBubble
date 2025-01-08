import { Component } from '@angular/core';
import {
  confirmPasswordReset,
  getAuth,
  verifyPasswordResetCode,
} from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { AuthUIService } from 'src/app/core/shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
@Component({
  selector: 'app-reset-password-link',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './reset-password-link.component.html',
  styleUrl: './reset-password-link.component.scss',
})
export class ResetPasswordLinkComponent {
  constructor(
    public authUIService: AuthUIService,
    public authService: AuthService,
    public activatedRoute: ActivatedRoute,
    public router: Router
  ) {}
  user = {
    password: '',
    confirmPassword: '',
  };

  passwordsMatch: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  oobCode: string = '';
  codeVerified = false;
  resetPasswordSubmitted = false;

  /**
   * Lifecycle hook for when the component is initialized. Verifies the password
   * reset code if it is present in the query parameters.
   */
  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
      if (this.oobCode) {
        this.verifyResetCode(this.oobCode);
      }
    });
  }

  /**
   * Verifies the password reset code and sets the component's state accordingly.
   * If the code is valid, the component's `codeVerified` property is set to true.
   * If the code is invalid or expired, the component's `errorMessage` property
   * is set to an appropriate error message and the `codeVerified` property is
   * set to false.
   * @param code The password reset code to verify.
   */
  async verifyResetCode(code: string) {
    try {
      const auth = getAuth();
      await verifyPasswordResetCode(auth, code);
      this.codeVerified = true;
    } catch (error) {
      console.error('Invalid or expired reset code:', error);
      this.codeVerified = false;
      this.errorMessage = 'The reset code is invalid or has expired.';
    }
  }

  /**
   * Checks if the password and confirmPassword fields in the user object match.
   * Updates the passwordsMatch property to true if they match, otherwise false.
   */

  checkPasswordsMatch(): void {
    this.passwordsMatch = this.user.password === this.user.confirmPassword;
  }

  /**
   * Handles the submission of the form. If the passwords match and the user
   * has entered a valid password, it calls the processPasswordReset method.
   * If the passwords do not match or the user has not entered a valid password,
   * it sets the errorMessage property to an appropriate error message.
   * If the code is invalid or expired, it sets the errorMessage property to
   * 'Invalid or expired reset code.'.
   */
  async onSubmit(): Promise<void> {
    if (this.passwordsMatch && this.user.password) {
      if (!this.oobCode || !this.codeVerified) {
        this.errorMessage = 'Invalid or expired reset code.';
        return;
      }
      await this.processPasswordReset();
    } else {
      this.errorMessage = 'Please ensure passwords match and are valid.';
    }
  }

  private async processPasswordReset(): Promise<void> {
    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, this.oobCode, this.user.password);
      this.handleSuccessfulReset();
    } catch (error) {
      this.handleResetError(error);
    }
  }

  /**
   * Handles the successful reset of the user's password. Sets the component's
   * state to indicate that the reset was successful and navigates the user to
   * the login page.
   */
  private handleSuccessfulReset(): void {
    this.resetPasswordSubmitted = true;
    this.successMessage = 'Your password has been successfully reset.';
    this.errorMessage = '';
    this.navigateToLogin();
  }

  /**
   * Handles errors that occur during the password reset process. Logs the error
   * to the console and sets the errorMessage property to an appropriate message.
   * Clears the successMessage property.
   * @param {any} error - The error encountered during the password reset.
   */

  private handleResetError(error: any): void {
    console.error('Error resetting password:', error);
    this.errorMessage = 'Error resetting password. Please try again.';
    this.successMessage = '';
  }

  navigateToResetPassword() {
    this.router.navigate(['/authentication/reset-password']);
  }

  navigateToLogin() {
    this.router.navigate(['/authentication/login']);
  }
}
