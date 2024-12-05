import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StatefulWindowServiceService {
  constructor() {}

  leftSideComponentState = signal<boolean>(true);
  rightSideComponentState = signal<boolean>(false);
  currentActiveComponentMobile = signal<string>('');
  startWidth = 1400;
  endWidth = 960;

  toggleLeftSideComponentState() {
    if (this.leftSideComponentState()) {
      {
        this.closeLeftSideComponentState();
      }
    } else {
      this.openLeftSideComponentState();
    }
  }

  openLeftSideComponentState() {
    if (
      window.innerWidth < this.startWidth &&
      window.innerWidth > this.endWidth
    ) {
      this.openLeftSideCloseRightSide();
    } else {
      this.leftSideComponentState.set(true);
    }
  }

  closeLeftSideComponentState() {
    this.leftSideComponentState.set(false);
  }

  toggleRightSideComponentState() {
    this.rightSideComponentState.update((state) => !state);
  }

  openRightSideComponentState() {
    if (
      window.innerWidth < this.startWidth &&
      window.innerWidth > this.endWidth
    ) {
      this.openRightSideCloseLeftSide();
    } else {
      this.rightSideComponentState.set(true);
    }
  }
  closeRightSideComponentState() {
    this.rightSideComponentState.set(false);
  }

  setActiveComponent(componentName: string) {
    this.currentActiveComponentMobile.set(componentName);
  }

  openRightSideCloseLeftSide() {
    this.rightSideComponentState.set(true);
    this.leftSideComponentState.set(false);
  }

  openLeftSideCloseRightSide() {
    this.rightSideComponentState.set(false);
    this.leftSideComponentState.set(true);
  }
}
