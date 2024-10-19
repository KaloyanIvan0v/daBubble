import { Routes } from '@angular/router';
import { AuthenticationComponent } from './core/components/authentication/authentication.component';
import { MainComponent } from './core/components/main/main.component';
export const routes: Routes = [
  {
    path: '',
    component: AuthenticationComponent,
  },
  {
    path: 'dashboard',
    component: MainComponent,
  },
  { path: '', redirectTo: 'channel-chat', pathMatch: 'full' },
];
