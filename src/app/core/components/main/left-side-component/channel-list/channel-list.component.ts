import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  currentActiveUnitId: string = '';
  private subscription: Subscription | undefined;

  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private router: Router
  ) {
    this.currentActiveUnitId = this.workspaceService.currentActiveUnitId();
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
    this.setChannelId(currentActiveUnitId);
    this.router.navigate(['dashboard', 'channel-chat']);
    this.currentActiveUnitId = this.workspaceService.currentActiveUnitId();
  }

  setChannelId(currentActiveUnitId: string) {
    this.workspaceService.currentActiveUnitId.set(currentActiveUnitId);
  }
}
