import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../../shared/services/pop-up-service/global-data.service';
import { FirebaseServicesService } from '../../../../shared/services/firebase/firebase.service';
import { Subscription } from 'rxjs';
import { Channel } from '../../../../shared/models/channel.class';

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
    private firebaseService: FirebaseServicesService
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
        next: (channels) => ((this.channels = channels), console.log(channels)),
        error: (error) =>
          console.error('Fehler beim Laden der Channels:', error),
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goToChannel(channelId: string) {
    // const channelData = this.firebaseService.getDoc<Channel>(
    //   'channels',
    //   channelId
    // );
    console.log(channelId);
  }
}
