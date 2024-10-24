import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalDataService } from '../../services/global-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent implements OnInit, OnDestroy {
  private addChannelVisibleSubscription!: Subscription;

  constructor(public globalDataService: GlobalDataService) {}
  visible: boolean = true;

  ngOnInit() {
    this.addChannelVisibleSubscription =
      this.globalDataService.popUpShadowVisible$.subscribe(
        (isVisible: boolean) => {
          this.visible = isVisible;
        }
      );
  }
  ngOnDestroy() {
    this.addChannelVisibleSubscription.unsubscribe();
  }

  closePopUp() {
    this.visible = false;
    this.globalDataService.closeAddChannel();
  }
}
