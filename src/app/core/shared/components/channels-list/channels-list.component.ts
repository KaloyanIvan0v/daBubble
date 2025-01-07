import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Channel } from '../../models/channel.class';

@Component({
  selector: 'app-channels-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channels-list.component.html',
  styleUrls: ['./channels-list.component.scss'],
})
export class ChannelsListComponent {
  /**
   * List of channels passed into this component.
   */
  @Input() channelsInput: Channel[] = [];

  /**
   * Emits the ID of the selected channel.
   */
  @Output() selectedChannel = new EventEmitter<string>();

  /**
   * Creates an instance of ChannelsListComponent.
   * @param firebaseService - Firebase service for data operations
   * @param workspaceService - Workspace service for managing workspace state
   * @param authService - Authentication service
   */
  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService
  ) {}

  /**
   * Emits the ID of the clicked channel to notify parent components.
   * @param channelId - The ID of the clicked channel
   */
  returnChannelId(channelId: string): void {
    this.selectedChannel.emit(channelId);
  }
}
