import { Component } from '@angular/core';
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
  constructor(public authUIService: AuthUIService) {}

  user = {
    email: '',
  };
}
