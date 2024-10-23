import { Routes } from '@angular/router';
import { AuthenticationComponent } from './core/components/authentication/authentication.component';
import { MainComponent } from './core/components/main/main.component';
import { SignupComponent } from './core/components/signup/signup.component';
import { LoginComponent } from './core/components/authentication/login/login.component';
import { ResetPasswordComponent } from './core/components/authentication/reset-password/reset-password.component';
export const routes: Routes = [
  {
    path: '',
    component: AuthenticationComponent,
  },
  {
    path: 'dashboard',
    component: MainComponent,
  },
  {
    path: 'app-login',
    component: LoginComponent,
  },
  {
    path: 'app-signup',
    component: SignupComponent,
  },

  { path: '', redirectTo: 'channel-chat', pathMatch: 'full' },
];
