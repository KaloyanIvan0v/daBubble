import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Subscription } from 'rxjs';
import { Channel } from '../../models/channel.class';

@Component({
  selector: 'app-channels-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channels-list.component.html',
  styleUrl: './channels-list.component.scss',
})
export class ChannelsListComponent {
  currentUserUid: string | null = null;
  @Input() channelsInput: Channel[] = [];
  @Output() selectedChannel = new EventEmitter<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public AuthService: AuthService
  ) {}

  returnChannelId(channelId: string) {
    console.log('Channel ID:', channelId);

    this.selectedChannel.emit(channelId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
