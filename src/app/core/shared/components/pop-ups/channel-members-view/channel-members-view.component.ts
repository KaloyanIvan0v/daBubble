import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Subscription, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-channel-members-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-members-view.component.html',
  styleUrls: ['./channel-members-view.component.scss'],
})
export class ChannelMembersViewComponent implements OnDestroy {
  channelData!: Channel;
  channelUsers$ = new BehaviorSubject<any[]>([]);

  currentUserUid: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public AuthService: AuthService
  ) {
    this.setLoggedInUserUid();
    this.initializeChannelEffect();
  }

  private initializeChannelEffect() {
    effect(this.channelEffectCallback.bind(this));
  }

  private async channelEffectCallback() {
    this.unsubscribeAll();
    const unitId = this.workspaceService.currentActiveUnitId();
    const channelSub = this.firebaseService
      .getChannel(unitId)
      .subscribe(this.channelSubscriptionCallback.bind(this));
    this.subscriptions.push(channelSub);
  }

  private async channelSubscriptionCallback(channel: Channel) {
    this.channelData = channel;
    this.channelUsers$.next(await this.getUsersOfChannel());
    this.updateChannelUsers();
  }

  private unsubscribeAll() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async setLoggedInUserUid() {
    this.currentUserUid = await this.AuthService.getCurrentUserUID();
  }

  updateChannelUsers() {
    const userUpdateSub = this.workspaceService.userUpdates$.subscribe(
      async () => {
        this.channelUsers$.next(await this.getUsersOfChannel());
      }
    );
    this.subscriptions.push(userUpdateSub);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async getUsersOfChannel(): Promise<any[]> {
    if (this.channelData) {
      const uids = this.channelData.uid;
      return await this.fetchUsersByUids(uids);
    }
    return [];
  }

  private async fetchUsersByUids(uids: string[]): Promise<any[]> {
    const users: any[] = [];
    for (const uid of uids) {
      const user = await this.firebaseService.getDocOnce('users', uid);
      if (user) {
        users.push(user);
      }
    }
    return users;
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
