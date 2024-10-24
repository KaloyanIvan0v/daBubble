import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalDataService {
  private popUpShadowVisibleSubject = new BehaviorSubject<boolean>(true);
  private addChannelVisibleSubject = new BehaviorSubject<boolean>(true);
  popUpShadowVisible$ = this.popUpShadowVisibleSubject.asObservable();
  addChannelVisible$ = this.addChannelVisibleSubject.asObservable();
  constructor() {}

  setPopUpVisible(isVisible: boolean) {
    this.popUpShadowVisibleSubject.next(isVisible);
  }

  getPopUpVisible(): boolean {
    return this.popUpShadowVisibleSubject.value;
  }

  openPopUp(popUp: BehaviorSubject<boolean>) {
    popUp.next(true);
    this.setPopUpVisible(true);
  }

  closeAddChannel() {
    this.addChannelVisibleSubject.next(false);
    this.popUpShadowVisibleSubject.next(false);
  }
  openAddChannel() {
    this.addChannelVisibleSubject.next(true);
    this.popUpShadowVisibleSubject.next(true);
  }
}
