import { Component } from '@angular/core';
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
    private authService: AuthService
  ) {}

  user = {
    email: '',
  };

  async onResetPassword() {
    if (!this.user.email) return;

    try {
      await this.authService.resetPassword(this.user.email);
      alert('A password reset link has been sent to your email.');
    } catch (error) {
      console.error('Reset Password Error:', error);
      alert('Failed to send reset email. Please try again later.');
    }
  }
}
