import { Component } from '@angular/core';
import { GlobalDataService } from '../../../shared/services/pop-up-service/global-data.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  constructor(
    public globalDataService: GlobalDataService,
    public firebaseService: FirebaseServicesService
  ) {}

  openPopUp() {
    this.globalDataService.openPopUp('userMenu');
    console.log(this.firebaseService.userUID);
  }
}
