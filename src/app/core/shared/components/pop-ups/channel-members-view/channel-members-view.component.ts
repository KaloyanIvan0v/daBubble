import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Subscription } from 'rxjs';

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
  private channelSubscription!: Subscription;

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService
  ) {
    effect(() => {
      if (this.channelSubscription) {
        this.channelSubscription.unsubscribe();
      }
      this.channelSubscription = this.firebaseService
        .getChannel(this.workspaceService.currentActiveUnitId())
        .subscribe((channel) => {
          this.channelData = channel;
          this.channelUsers = this.getUsersOfChannel();
        });
      return () => {
        if (this.channelSubscription) {
          this.channelSubscription.unsubscribe();
        }
      };
    });
  }

  ngOnDestroy() {
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
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

  closePopUp() {
    this.workspaceService.channelMembersPopUp.set(false);
  }

  openProfileView(uid: string) {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  openAddUserToChannelPopUp() {
    this.closePopUp();
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  get popUpVisible() {
    return this.workspaceService.channelMembersPopUp();
  }
}
