import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { authState } from '@angular/fire/auth';
import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Subscription } from 'rxjs';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { AddUserToChannelComponent } from 'src/app/core/shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { ChannelMembersViewComponent } from 'src/app/core/shared/components/pop-ups/channel-members-view/channel-members-view.component';
import { EditChannelComponent } from 'src/app/core/shared/components/pop-ups/edit-channel/edit-channel.component';

@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [
    InputBoxComponent,
    CommonModule,
    AddUserToChannelComponent,
    ChannelMembersViewComponent,
    EditChannelComponent,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss'],
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  channelData!: Channel;
  channelName: string = '';
  channelId: string = '';
  userAmount: number = 0;
  channelUsers: any[] = [];
  popUpStates: { [key: string]: boolean } = {};
  private popUpStatesSubscription!: Subscription;
  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    private authService: AuthService
  ) {
    effect(() => {
      this.channelId = this.workspaceService.currentActiveUnitId();
      if (this.channelId) {
        this.loadChannelData(this.channelId);
      } else {
        console.warn('Keine gültige channelId verfügbar.');
      }
    });
  }

  ngOnInit(): void {}

  private loadChannelData(channelId: string): void {
    this.channelUsers = [];
    this.subscriptions.add(
      this.firebaseService.getChannel(channelId).subscribe({
        next: (channel) => {
          if (channel) {
            this.channelData = channel;
            this.channelName = channel.name;
            this.userAmount = channel.uid.length;
            this.loadUsers();
          }
        },
        error: (error) =>
          console.error('Fehler beim Laden des Channels:', error),
      })
    );
  }

  async loadUsers() {
    const channelUids = this.channelData.uid;
    const userPromises = channelUids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = await Promise.all(userPromises);
    this.channelUsers = users.filter((user) => user != null);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.popUpStatesSubscription) {
      this.popUpStatesSubscription.unsubscribe();
    }
  }

  openEditChannelPopUp() {
    this.workspaceService.editChannelPopUp.set(true);
  }

  openAddUserToChannelPopUp() {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  openChannelUsersViewPopUp() {
    this.workspaceService.channelMembersPopUp.set(true);
  }
}
