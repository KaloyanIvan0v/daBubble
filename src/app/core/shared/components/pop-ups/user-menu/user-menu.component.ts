import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../../services/pop-up-service/global-data.service';
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  constructor(public globalDataService: GlobalDataService) {}
}
