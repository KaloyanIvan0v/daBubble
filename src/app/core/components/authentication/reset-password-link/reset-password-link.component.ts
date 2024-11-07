import { Component } from '@angular/core';
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
  constructor(public authUIService: AuthUIService) {}

  user = {
    password: '',
  };
}
