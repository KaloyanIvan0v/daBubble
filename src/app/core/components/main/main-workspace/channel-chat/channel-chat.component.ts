import { Component, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { GlobalDataService } from 'src/app/core/shared/services/pop-up-service/global-data.service';
import { Subscription } from 'rxjs';
import { Channel } from 'src/app/core/shared/models/channel.class';

@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [InputBoxComponent],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss'],
})
export class ChannelChatComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  channelData!: Channel;
  channelName!: string;
  channelId: string = '';

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    private globalDataService: GlobalDataService
  ) {
    effect(() => {
      this.channelId = this.workspaceService.currentActiveUnitId();
      this.loadChannelData(this.channelId);
    });
  }

  ngOnInit(): void {}

  private loadChannelData(channelId: string): void {
    this.subscriptions.add(
      this.firebaseService.getDoc<Channel>('channels', channelId).subscribe({
        next: (channel) => {
          this.channelData = channel;
          this.channelName = channel.name;
        },
        error: (error) =>
          console.error('Fehler beim Laden der Channels:', error),
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openEditChannelPopUp() {
    this.globalDataService.openPopUp('editChannel');
  }
}
