import { Routes } from '@angular/router';
import { AuthenticationComponent } from './core/components/authentication/authentication.component';
import { MainComponent } from './core/components/main/main.component';
import { SignupComponent } from './core/components/signup/signup.component';
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
    path: 'app-signup',
    component: SignupComponent,
  },
  { path: '', redirectTo: 'channel-chat', pathMatch: 'full' },
];
