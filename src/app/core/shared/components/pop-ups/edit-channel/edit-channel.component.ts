import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Observable } from 'rxjs';
import { User } from 'src/app/core/shared/models/user.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss',
})
export class EditChannelComponent {
  channelData$!: Observable<Channel>;
  channelData!: Channel;
  currentChannelId: string = '';
  channelCreator$!: Observable<User>;
  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    public authService: AuthService,
    private router: Router
  ) {
    effect(() => {
      this.currentChannelId = this.workspaceService.currentActiveUnitId();
      this.channelData$ = this.firebaseService.getChannel(
        this.currentChannelId
      );
      this.setInputValues();
      this.channelData$.subscribe((channelData: Channel) => {
        this.setChannelCreator(channelData.creator);
      });
    });
  }

  async setChannelCreator(creatorUid: string) {
    const currentUserUid = await this.authService.getCurrentUserUID();
    if (currentUserUid) {
      this.channelCreator$ = this.firebaseService.getUser(creatorUid);
    }
  }

  setInputValues() {
    this.channelData$.subscribe((data) => {
      this.channelData = data;
    });
  }

  editNameActive: boolean = false;
  editDescriptionActive: boolean = false;

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
    const currentLoggedInUserUid = await this.authService.getCurrentUserUID();
    this.channelData.uid = this.channelData.uid.filter(
      (uid) => uid !== currentLoggedInUserUid
    );
    this.saveChanges();
    this.closeEditChannelPopUp();
    this.navigateToNewChat();
  }

  navigateToNewChat() {
    this.router.navigate(['dashboard', 'new-chat']);
  }

  get popUpVisible() {
    return this.workspaceService.editChannelPopUp();
  }
}
