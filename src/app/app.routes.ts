import { Routes } from '@angular/router';
import { AuthenticationComponent } from './core/components/authentication/authentication.component';
import { MainComponent } from './core/components/main/main.component';
import { SignupComponent } from './core/components/authentication/signup/signup.component';
import { LoginComponent } from './core/components/authentication/login/login.component';
import { ResetPasswordComponent } from './core/components/authentication/reset-password/reset-password.component';
import { MainWorkspaceRoutes } from './core/components/main/main-workspace/main-workspace-routing';
import { AuthGuard } from './auth.guard';
import { ResetPasswordLinkComponent } from './core/components/authentication/reset-password-link/reset-password-link.component';
import { DirectChatComponent } from './core/components/main/main-workspace/direct-chat/direct-chat.component';
import { ChannelChatComponent } from './core/components/main/main-workspace/channel-chat/channel-chat.component';
import { ChooseAvatarComponent } from './core/components/authentication/choose-avatar/choose-avatar.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'authentication/reset-password-link',
    pathMatch: 'full',
  },
  {
    path: 'authentication',
    component: AuthenticationComponent,
    children: [
      {
        path: 'login',
        component: LoginComponent,
        data: { modeClass: 'login-mode' },
      },
      {
        path: 'signup',
        component: SignupComponent,
        data: { modeClass: 'signup-mode' },
      },
      {
        path: 'choose-avatar',
        component: ChooseAvatarComponent,
        data: { modeClass: 'avatar-mode' },
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        data: { modeClass: 'reset-password-mode' },
      },
      {
        path: 'reset-password-link',
        component: ResetPasswordLinkComponent,
        data: { modeClass: 'reset-link-mode' },
      },
      { path: '', redirectTo: 'reset-password-link', pathMatch: 'full' },
      { path: '**', redirectTo: 'reset-password-link' },
    ],
  },
  {
    path: 'dashboard',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      ...MainWorkspaceRoutes,
      {
        path: 'direct-chat/:chatId',
        component: DirectChatComponent,
      },
      {
        path: 'channel-chat/:channelId',
        component: ChannelChatComponent,
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
