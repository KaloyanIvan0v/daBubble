import { Component } from '@angular/core';
import { SharedModule } from '../../shared/shared-module';
import { FocusService } from 'src/app/core/shared/services/focus-services/focus.service';
import { FirebaseServicesService } from '../../shared/services/firebase.service';
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
    public focusService: FocusService
  ) {}

  isChecked: boolean = false;

  toggleCheckbox() {
    this.isChecked = !this.isChecked;
  }
}
