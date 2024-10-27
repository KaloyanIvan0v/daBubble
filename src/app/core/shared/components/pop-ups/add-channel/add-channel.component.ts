import { Channel } from 'src/app/core/shared/models/channel.class';
import { Component, Input } from '@angular/core';
import { GlobalDataService } from '../../../services/pop-up-service/global-data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  constructor(
    public globalDataService: GlobalDataService,
    public firebaseService: FirebaseServicesService
  ) {}
  channelName: string = '';
  chanelDescription: string = '';

  closePopUp() {
    this.globalDataService.closePopUp();
  }

  createChannel() {
    const newChannel: Channel = {
      id: '',
      name: this.channelName,
      description: this.chanelDescription,
      users: {},
      messages: {},
      creator: '',
    };

    this.firebaseService.addDoc('channels', newChannel);
    this.globalDataService.closePopUp();
  }
}
