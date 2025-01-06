import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from '../../../../shared/services/firebase/firebase.service';
import { Subscription } from 'rxjs';
import { Channel } from '../../../../shared/models/channel.class';
import { Router } from '@angular/router';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss',
})
export class ChannelListComponent {
  channelListOpen: boolean = false;
  channels: Channel[] = [];
  private subscription: Subscription | undefined;

  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private router: Router,
    private statefulWindowService: StatefulWindowServiceService
  ) {}

  /**
   * Gets the currently active unit ID from the workspace service.
   * @returns The currently active unit ID.
   */
  get currentActiveUnitId() {
    return this.workspaceService.currentActiveUnitId();
  }

  toggleChannelList() {
    this.channelListOpen = !this.channelListOpen;
  }

  openAddChannel() {
    this.workspaceService.addChannelPopUp.set(true);
  }

  /**
   * Initializes the component by subscribing to the channel data from the Firebase service.
   * Updates the channels array with the received data or logs an error if one occurs during
   * the subscription process.
   */

  ngOnInit(): void {
    this.subscription = this.firebaseService.getChannels().subscribe({
      next: (channels) => (this.channels = channels),
      error: (error) => console.error('Fehler beim Laden der Channels:', error),
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Navigate to the channel-chat page and set the currentActiveUnitId.
   * Additionally, if the screen width is smaller than 960px, open the chat on mobile devices.
   * @param currentActiveUnitId The id of the channel to be navigated to.
   */
  navigateToChannelChat(currentActiveUnitId: string) {
    this.setCurrentActiveUnitId(currentActiveUnitId);
    this.router.navigate(['dashboard', 'channel-chat']);
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  /**
   * Sets the current active unit ID in the workspace service.
   * This ID is used to identify the currently active channel or unit.
   * @param currentActiveUnitId - The ID of the channel to be set as the current active unit.
   */

  setCurrentActiveUnitId(currentActiveUnitId: string) {
    this.workspaceService.currentActiveUnitId.set(currentActiveUnitId);
  }
}
