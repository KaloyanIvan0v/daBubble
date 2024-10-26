import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../services/global-data.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  constructor(public globalDataService: GlobalDataService) {}
}
