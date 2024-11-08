import { Channel } from 'src/app/core/shared/models/channel.class';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  constructor(
    public firebaseService: FirebaseServicesService,
    public authService: AuthService
  ) {}
  channelName: string = '';
  chanelDescription: string = '';
  @Input() popUpOpen: boolean = true;

  closePopUp() {
    this.popUpOpen = false;
  }

  async createChannel() {
    const uid = await this.authService.getCurrentUserUID();

    const newChannel: Channel = {
      uid: [uid ?? ''],
      id: '',
      name: this.channelName,
      description: this.chanelDescription,
      messages: [],
      creator: uid ?? '',
    };

    this.firebaseService.addDoc('channels', newChannel);
  }
}
