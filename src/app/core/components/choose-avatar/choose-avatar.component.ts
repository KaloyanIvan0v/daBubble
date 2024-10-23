import { Component } from '@angular/core';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  constructor(public authUIService: AuthUIService) {}

  photos: string[] = [
    'assets/img/profile-img/Elise-Roth.svg',
    'assets/img/profile-img/Elias-Neumann.svg',
    'assets/img/profile-img/Frederik-Beck.svg',
    'assets/img/profile-img/Steffen-Hoffmann.svg',
    'assets/img/profile-img/Sofia-Müller.svg',
    'assets/img/profile-img/Noah-Braun.svg',
  ];
}
