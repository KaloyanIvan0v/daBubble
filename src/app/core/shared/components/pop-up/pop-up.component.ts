import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../services/global-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pop-up',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pop-up.component.html',
  styleUrl: './pop-up.component.scss',
})
export class PopUpComponent implements OnInit, OnDestroy {
  isPopUpVisible: boolean = false;
  private popUpSubscription!: Subscription;

  constructor(private globalDataService: GlobalDataService) {}

  ngOnInit() {
    this.popUpSubscription =
      this.globalDataService.popUpShadowVisible$.subscribe(
        (isVisible: boolean) => {
          this.isPopUpVisible = isVisible;
        }
      );
  }
  ngOnDestroy() {
    this.popUpSubscription.unsubscribe();
  }

  closePopup() {
    this.globalDataService.setPopUpVisible(false);
  }
}
