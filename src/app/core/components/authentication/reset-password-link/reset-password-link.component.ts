import { Component } from '@angular/core';
import {
  confirmPasswordReset,
  getAuth,
  verifyPasswordResetCode,
} from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
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
    private route: ActivatedRoute
  ) {}
  user = {
    password: '',
    confirmPassword: '',
  };

  passwordsMatch: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  oobCode: string = ''; // The password reset code from the URL
  codeVerified = false;

  ngOnInit() {
    // Get the 'oobCode' from the URL query parameters
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
      if (this.oobCode) {
        this.verifyResetCode(this.oobCode); // Verify the reset code
      }
    });
  }

  // Verify if the reset code is valid
  async verifyResetCode(code: string) {
    try {
      const auth = getAuth();
      await verifyPasswordResetCode(auth, code); // Firebase will verify the code
      this.codeVerified = true; // Code is valid, allow the user to reset password
    } catch (error) {
      console.error('Invalid or expired reset code:', error);
      this.codeVerified = false; // The code is invalid or expired
      this.errorMessage = 'The reset code is invalid or has expired.';
    }
  }

  checkPasswordsMatch(): void {
    this.passwordsMatch = this.user.password === this.user.confirmPassword;
  }

  // Handle the password reset process after the user enters the new password
  async onSubmit(): Promise<void> {
    if (this.passwordsMatch && this.user.password) {
      if (!this.oobCode || !this.codeVerified) {
        this.errorMessage = 'Invalid or expired reset code.';
        return;
      }

      try {
        const auth = getAuth(); // Firebase Auth instance

        // Reset the password using Firebase's confirmPasswordReset function
        await confirmPasswordReset(auth, this.oobCode, this.user.password);

        this.successMessage = 'Your password has been successfully reset.';
        this.errorMessage = ''; // Reset any error message

        // Redirect to login page after successful password reset
        this.authUIService.toggleLogin();
      } catch (error) {
        console.error('Error resetting password:', error);
        this.errorMessage = 'Error resetting password. Please try again.';
        this.successMessage = ''; // Reset any success message
      }
    } else {
      this.errorMessage = 'Please ensure passwords match and are valid.';
    }
  }
}
