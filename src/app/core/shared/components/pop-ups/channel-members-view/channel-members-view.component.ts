import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Channel } from 'src/app/core/shared/models/channel.class';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
@Component({
  selector: 'app-channel-members-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-members-view.component.html',
  styleUrl: './channel-members-view.component.scss',
})
export class ChannelMembersViewComponent {
  channelData!: Channel;
  channelUsers: any[] = [];
  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService
  ) {
    this.firebaseService
      .getDoc<Channel>('channels', this.workspaceService.currentActiveUnitId())
      .subscribe((channel) => {
        this.channelData = channel;
      });

    this.channelUsers = this.getUsersOfChannel() ?? [];
  }

  getUsersOfChannel() {
    if (this.channelData) {
      const uids = this.channelData.uid;
      const users: any[] = [];
      for (let i = 0; i < uids.length; i++) {
        const uid = uids[i];
        this.firebaseService.getDoc('users', uid).subscribe((user) => {
          if (user) {
            users.push(user);
          }
        });
      }
      return users;
    }
    return [];
  }
  closePopUp() {}

  openProfileView(user: any) {}

  openAddUserToChannelPopUp() {}
}
