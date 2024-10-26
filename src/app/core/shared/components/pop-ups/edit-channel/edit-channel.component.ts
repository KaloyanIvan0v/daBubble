import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../services/global-data.service';

@Component({
  selector: 'app-edit-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss',
})
export class EditChannelComponent {
  constructor(public globalDataService: GlobalDataService) {}

  editNameActive: boolean = false;
  editDescriptionActive: boolean = false;

  toggleEditName() {
    this.editNameActive = !this.editNameActive;
  }

  toggleEditDescription() {
    this.editDescriptionActive = !this.editDescriptionActive;
  }
  closeAddChannelPopUp() {
    this.globalDataService.closePopUp();
  }
}
