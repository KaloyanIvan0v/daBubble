import { Component, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Observable, Subject } from 'rxjs';
import { User } from 'src/app/core/shared/models/user.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Router } from '@angular/router';
import { takeUntil, first } from 'rxjs/operators';
import { UserListComponent } from '../../user-list/user-list.component';

@Component({
  selector: 'app-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, UserListComponent],
  templateUrl: './edit-channel.component.html',
  styleUrls: ['./edit-channel.component.scss'],
})
export class EditChannelComponent implements OnDestroy {
  channelData$!: Observable<Channel>;
  channelData!: Channel;
  currentChannelId: string = '';
  channelCreator$!: Observable<User>;
  private destroy$ = new Subject<void>();

  editNameActive: boolean = false;
  editDescriptionActive: boolean = false;

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    public authService: AuthService,
    private router: Router
  ) {
    this.initializeChannelData();
  }

  private initializeChannelData() {
    effect(() => {
      this.currentChannelId = this.workspaceService.currentActiveUnitId();
      this.channelData$ = this.firebaseService.getChannel(
        this.currentChannelId
      );
      this.setInputValues();
      this.subscribeToChannelData();
    });
  }

  private subscribeToChannelData() {
    this.channelData$
      .pipe(
        first((channelData) => channelData !== null),
        takeUntil(this.destroy$)
      )
      .subscribe((channelData: Channel) => {
        this.setChannelCreator(channelData.creator);
      });
  }

  async setChannelCreator(creatorUid: string) {
    const currentUserUid = await this.authService.getCurrentUserUID();
    if (currentUserUid) {
      this.channelCreator$ = this.firebaseService.getUser(creatorUid);
    }
  }

  setInputValues() {
    this.channelData$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.channelData = data;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleEditName() {
    this.editNameActive = !this.editNameActive;
  }

  toggleEditDescription() {
    this.editDescriptionActive = !this.editDescriptionActive;
  }

  closeEditChannelPopUp() {
    this.workspaceService.editChannelPopUp.set(false);
  }

  saveChanges() {
    this.firebaseService.updateDoc<Channel>(
      'channels',
      this.currentChannelId,
      this.channelData
    );
  }

  async leaveChannel() {
    await this.removeCurrentUserFromChannel();
    this.saveChanges();
    this.closeEditChannelPopUp();
    this.navigateToNewChat();
  }

  private async removeCurrentUserFromChannel() {
    const currentLoggedInUserUid = await this.authService.getCurrentUserUID();
    this.channelData.uid = this.channelData.uid.filter(
      (uid) => uid !== currentLoggedInUserUid
    );
  }

  navigateToNewChat() {
    this.router.navigate(['dashboard', 'new-chat']);
  }

  get popUpVisible() {
    return this.workspaceService.editChannelPopUp();
  }

  onUserSelected($event: User) {
    this.openProfileView($event.uid);
  }

  openProfileView(uid: string) {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  openAddUserToChannelPopUp() {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }
}
