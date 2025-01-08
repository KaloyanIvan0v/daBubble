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

  /**
   * Updates the state of the service based on the provided screen width.
   * Sets 'isBelow960' to true if the screen width is less than or equal to 960 pixels,
   * otherwise sets it to false.
   *
   * @param screenWidth - The current width of the screen in pixels.
   */

  updateView(screenWidth: number): void {
    this.isBelow960 = screenWidth <= 960;
  }

  /**
   * Toggles the state of the left side component.
   * If the component is currently open, it will be closed,
   * otherwise it will be opened.
   */
  toggleLeftSideComponentState() {
    if (this.leftSideComponentState()) {
      {
        this.closeLeftSideComponentState();
      }
    } else {
      this.openLeftSideComponentState();
    }
  }

  /**
   * Opens the left side component. If the window's inner width is between
   * `startWidth` and `endWidth`, it opens the left side and closes the right side.
   * Otherwise, it simply sets the left side component state to open.
   */

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

  /**
   * Toggles the state of the right side component.
   * If the component is currently open, it will be closed,
   * otherwise it will be opened.
   */
  toggleRightSideComponentState() {
    this.rightSideComponentState.update((state) => !state);
  }

  /**
   * Opens the right side component. If the window's inner width is between
   * `startWidth` and `endWidth`, it opens the right side and closes the left side.
   * Otherwise, it simply sets the right side component state to open.
   */
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
