import { Component } from '@angular/core';
import { GlobalDataService } from '../../services/global-data.service';

@Component({
  selector: 'app-pop-up',
  standalone: true,
  imports: [],
  templateUrl: './pop-up.component.html',
  styleUrl: './pop-up.component.scss',
})
export class PopUpComponent {
  constructor(public globalDataService: GlobalDataService) {}

  closePopUp() {
    this.globalDataService.closePopUp();
  }
}
