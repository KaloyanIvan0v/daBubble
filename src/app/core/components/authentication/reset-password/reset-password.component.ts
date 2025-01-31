import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { AuthUIService } from 'src/app/core/shared/services/authUI-services/authUI.service';
import { SharedModule } from 'src/app/core/shared/shared-module';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  constructor(
    public authUIService: AuthUIService,
    private authService: AuthService,
    public router: Router,
    public activatedRoute: ActivatedRoute
  ) {}

  user = {
    email: '',
  };

  resetLinkSent = false;

  /**
   * Resets the password for the user with the given email
   * @returns Promise that resolves if the password reset email is sent successfully
   */
  async onResetPassword() {
    if (!this.user.email) return;

    try {
      await this.authService.resetPassword(this.user.email);
      this.resetLinkSent = true;
      this.emailSentSuccess();
    } catch (error) {
      console.error('Reset Password Error:', error);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/authentication/login']);
  }

  /**
   * Displays a temporary "email sent" success message to the user.
   * Sets the `showEmailSent` property of `authUIService` to true,
   * then automatically hides the message after 1.5 seconds by setting
   * the property back to false.
   */

  emailSentSuccess() {
    this.authUIService.showEmailSent = true;

    setTimeout(() => {
      this.authUIService.showEmailSent = false;
    }, 1500);
  }
}
