import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../../shared/services/pop-up-service/global-data.service';
import { FirebaseServicesService } from '../../../../shared/services/firebase/firebase.service';
import { Subscription } from 'rxjs';
import { Channel } from '../../../../shared/models/channel.class';
import { Router } from '@angular/router';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

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
    private globalDataService: GlobalDataService,
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  toggleChannelList() {
    this.channelListOpen = !this.channelListOpen;
  }

  openAddChannel() {
    this.globalDataService.openPopUp('addChannel');
  }

  ngOnInit(): void {
    this.subscription = this.firebaseService
      .getCollection<Channel>('channels')
      .subscribe({
        next: (channels) => (this.channels = channels),
        error: (error) =>
          console.error('Fehler beim Laden der Channels:', error),
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goToChannel(channelId: string) {
    this.navigateToChannelChat(channelId);
  }

  navigateToChannelChat(channelId: string) {
    this.setCurrentChannelId(channelId);
    this.router.navigate(['dashboard', 'channel-chat']);
  }

  setCurrentChannelId(channelId: string) {
    this.workspaceService.setCurrentChannelId(channelId);
  }
}
