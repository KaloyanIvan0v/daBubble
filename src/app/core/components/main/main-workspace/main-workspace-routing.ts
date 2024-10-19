import { Routes } from '@angular/router';
import { ChannelChatComponent } from './channel-chat/channel-chat.component';
import { DirectChatComponent } from './direct-chat/direct-chat.component';
import { NewChatComponent } from './new-chat/new-chat.component';

export const MainWorkspaceRoutes: Routes = [
  { path: 'new-chat', component: NewChatComponent },
  { path: 'direct-chat', component: DirectChatComponent },
  { path: 'channel-chat', component: ChannelChatComponent },
  { path: '', redirectTo: 'channel-chat', pathMatch: 'full' },
];
