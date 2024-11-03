import { Routes } from '@angular/router';
import { AuthenticationComponent } from './core/components/authentication/authentication.component';
import { MainComponent } from './core/components/main/main.component';
import { SignupComponent } from './core/components/authentication/signup/signup.component';
import { LoginComponent } from './core/components/authentication/login/login.component';
import { ResetPasswordComponent } from './core/components/authentication/reset-password/reset-password.component';
import { MainWorkspaceRoutes } from './core/components/main/main-workspace/main-workspace-routing';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthenticationComponent,
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: MainWorkspaceRoutes,
  },
  {
    path: 'app-authentication',
    component: AuthenticationComponent,
  },
  {
    path: 'app-login',
    component: LoginComponent,
  },
  {
    path: 'app-signup',
    component: SignupComponent,
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },

  { path: '**', redirectTo: '' },
];
