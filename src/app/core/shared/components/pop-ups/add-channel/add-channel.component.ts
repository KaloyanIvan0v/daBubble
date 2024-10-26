import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../services/global-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  private addChannelVisibleSubscription!: Subscription;

  constructor(public globalDataService: GlobalDataService) {}

  closeAddChannelPopUp() {
    this.globalDataService.closePopUp();
  }
}
