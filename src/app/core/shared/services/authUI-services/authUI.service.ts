import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthUIService {
  constructor() {}

  showLogin = false;
  showSignup = false;
  showAvatarSelection = false;
  showResetPassword = false;
  isChecked: boolean = false;

  toggleLogin() {
    this.showLogin = !this.showLogin;
    if (this.showLogin) {
      this.showAvatarSelection = false;
      this.showSignup = false;
      this.showResetPassword = false;
    }
  }

  toggleSignup() {
    this.showSignup = !this.showSignup;
    if (this.showSignup) {
      this.showAvatarSelection = false;
      this.showResetPassword = false;
    }
  }

  toggleAvatarSelection() {
    this.showAvatarSelection = true;
    this.showSignup = false;
  }

  toggleResetPassword() {
    this.showResetPassword = true;
    this.showSignup = false;
    this.showAvatarSelection = false;
  }

  toggleCheckbox() {
    this.isChecked = !this.isChecked;
  }

  getAuthWrapperHeight() {
    if (
      this.showResetPassword &&
      !this.showSignup &&
      !this.showAvatarSelection
    ) {
      return '469px';
    } else if (this.showSignup || this.showAvatarSelection) {
      return '669px';
    } else {
      return '769px';
    }
  }

  getAuthWrapperWidth() {
    if (
      this.showResetPassword &&
      !this.showSignup &&
      !this.showAvatarSelection
    ) {
      return '698px';
    } else if (this.showSignup || this.showAvatarSelection) {
      return '606px';
    } else {
      return '606px';
    }
  }

  shouldShowLogin(): boolean {
    return (
      !this.showSignup && !this.showAvatarSelection && !this.showResetPassword
    );
  }

  shouldShowSignup(): boolean {
    return (
      this.showSignup && !this.showAvatarSelection && !this.showResetPassword
    );
  }

  shouldShowAvatarSelection(): boolean {
    return this.showAvatarSelection;
  }

  shouldShowResetPassword(): boolean {
    return this.showResetPassword && !this.showAvatarSelection;
  }

  focused: { [key: string]: boolean } = {
    name: false,
    email: false,
    password: false,
  };

  onFocus(inputType: string): void {
    this.focused[inputType] = true;
  }

  onBlur(inputType: string): void {
    this.focused[inputType] = false;
  }
}
