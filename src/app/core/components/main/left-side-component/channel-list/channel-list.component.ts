import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from './../../../../shared/services/global-data.service';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channel-list.component.html',
  styleUrl: './channel-list.component.scss',
})
export class ChannelListComponent {
  channelListOpen: boolean = false;

  constructor(private globalDataService: GlobalDataService) {}

  toggleChannelList() {
    this.channelListOpen = !this.channelListOpen;
  }

  openAddChannel() {
    this.globalDataService.openPopUp('addChannel');
  }
}
