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

  async onResetPassword() {
    if (!this.user.email) return;

    try {
      await this.authService.resetPassword(this.user.email);
      this.resetLinkSent = true;
    } catch (error) {
      console.error('Reset Password Error:', error);
    }
  }

  navigateToLogin() {
    this.router.navigate(['/authentication/login']);
  }

  emailSentSuccess() {
    this.authUIService.showEmailSent = true;

    setTimeout(() => {
      this.authUIService.showEmailSent = false;
    }, 1500);
  }
}
