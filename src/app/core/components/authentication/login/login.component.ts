import { SharedModule } from '../../../shared/shared-module';
import { FirebaseServicesService } from '../../../shared/services/firebase/firebase.service';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../shared/services/auth-services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthUIService } from 'src/app/core/shared/services/authUI-services/authUI.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  user = {
    email: '',
    password: '',
  };

  loginError: boolean = false;

  constructor(
    public authService: AuthService,
    private firebaseService: FirebaseServicesService,
    private router: Router,
    public authUIService: AuthUIService,
    public activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {}

  /**
   * Handles the login process when the user submits the login form.
   * The method first prevents the default form submission behavior and
   * checks if the email and password are valid. If the values are valid,
   * it calls the `processLogin` method to log in the user.
   * @param event The event that triggered the login process.
   */
  async onLogin(event: Event) {
    event.preventDefault();

    if (!this.user.email || !this.user.password) {
      return;
    }

    await this.processLogin(this.user.email, this.user.password);
  }

/**
 * Attempts to log in a user with the provided email and password.
 * If the login is successful, it handles post-login actions and resets
 * the login error state. If the login fails, sets the login error state.
 *
 * @param email - The email address of the user attempting to log in.
 * @param password - The password of the user attempting to log in.
 */

  private async processLogin(email: string, password: string) {
    try {
      const user = await this.authService.login(email, password);
      if (user) {
        await this.handleSuccessfulLogin();
        this.loginError = false;
      }
    } catch (error) {
      this.loginError = true;
    }
  }

  /**
   * Handles the post-login actions after a successful login.
   * This involves getting the current user's UID, setting it in the
   * Firebase service, and then navigating to the dashboard.
   */
  private async handleSuccessfulLogin() {
    const uid = await this.authService.getCurrentUserUID();
    this.firebaseService.setUserUID(uid);
    this.router.navigate(['/dashboard']);
  }

  /**
   * Checks the current authentication status of the user.
   * @returns a promise that resolves to true if the user is authenticated,
   * false otherwise
   */
  async checkAuthStatus(): Promise<boolean> {
    return await this.authService.isAuthenticated;
  }

  /**
   * Logs in as a guest user. This is a convenience function for
   * demonstration purposes only. In a real application, you would
   * not want to hard-code credentials like this.
   * @param event the event that triggered the login process
   */
  async guestLogin(event: Event) {
    event.preventDefault();
    try {
      const user = await this.authService.login('guest@web.de', '12345678');
      if (user) {
        const uid = await this.authService.getCurrentUserUID();
        this.firebaseService.setUserUID(uid);
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  navigateToResetPassword() {
    this.router.navigate(['/authentication/reset-password']);
  }
}
