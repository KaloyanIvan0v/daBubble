import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [BrowserModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  user = {
    email: '',
    password: '',
  };

  onSubmit() {
    if (this.user.email && this.user.password) {
      console.log('Login successful!', this.user);
    } else {
      console.log('Please fill in all fields.');
    }
  }
}
