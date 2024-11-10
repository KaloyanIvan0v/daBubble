import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Observable } from 'rxjs';

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
  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService
  ) {
    this.currentChannelId = this.workspaceService.currentActiveUnitId();
    this.channelData$ = this.firebaseService.getDoc<Channel>(
      'channels',
      this.currentChannelId
    );
  }

  ngOnInit() {
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
    console.log('gesperrt');

    this.firebaseService.updateDoc<Channel>(
      'channels',
      this.currentChannelId,
      this.channelData
    );
  }

  get popUpVisible() {
    return this.workspaceService.editChannelPopUp();
  }
}
