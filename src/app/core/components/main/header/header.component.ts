import { Component } from '@angular/core';

import { GlobalDataService } from '../../../shared/services/pop-up-service/global-data.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(public globalDataService: GlobalDataService) {}

  openPopUp() {
    this.globalDataService.openPopUp('userMenu');
  }
}
