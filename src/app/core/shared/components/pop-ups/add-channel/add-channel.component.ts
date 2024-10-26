import { Component } from '@angular/core';
import { GlobalDataService } from '../../../services/global-data.service';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  constructor(public globalDataService: GlobalDataService) {}

  closeAddChannelPopUp() {
    this.globalDataService.closePopUp();
  }
}
