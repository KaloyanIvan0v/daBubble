import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StatefulWindowServiceService {
  constructor() {}

  leftSideComponentState = signal<boolean>(true);
  rightSideComponentState = signal<boolean>(false);
  currentActiveComponentMobile = signal<'left' | 'chat' | 'thread'>('left');
  startWidth = 1400;
  endWidth = 960;
  isBelow960: boolean = false;

  updateView(screenWidth: number): void {
    this.isBelow960 = screenWidth <= 960;
  }

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

  openRightSideCloseLeftSide() {
    this.rightSideComponentState.set(true);
    this.leftSideComponentState.set(false);
  }

  openLeftSideCloseRightSide() {
    this.rightSideComponentState.set(false);
    this.leftSideComponentState.set(true);
  }

  setMobileViewMode(mode: 'left' | 'chat' | 'thread') {
    this.currentActiveComponentMobile.set(mode);
  }

  openChatOnMobile() {
    this.setMobileViewMode('chat');
  }

  openThreadOnMobile() {
    this.setMobileViewMode('thread');
  }

  backToListOnMobile() {
    this.setMobileViewMode('left');
  }
}
