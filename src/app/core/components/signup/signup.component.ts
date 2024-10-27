import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  user = {
    name: '',
    email: '',
    password: '',
  };
  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService
  ) {}
}
