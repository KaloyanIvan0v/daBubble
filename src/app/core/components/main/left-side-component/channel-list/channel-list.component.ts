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

  get currentActiveUnitId() {
    return this.workspaceService.currentActiveUnitId();
  }

  toggleChannelList() {
    this.channelListOpen = !this.channelListOpen;
  }

  openAddChannel() {
    this.workspaceService.addChannelPopUp.set(true);
  }

  ngOnInit(): void {
    this.subscription = this.firebaseService.getChannels().subscribe({
      next: (channels) => (this.channels = channels),
      error: (error) => console.error('Fehler beim Laden der Channels:', error),
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  navigateToChannelChat(currentActiveUnitId: string) {
    this.setCurrentActiveUnitId(currentActiveUnitId);
    this.router.navigate(['dashboard', 'channel-chat']);
    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }

  setCurrentActiveUnitId(currentActiveUnitId: string) {
    this.workspaceService.currentActiveUnitId.set(currentActiveUnitId);
  }
}
