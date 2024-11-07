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
  showResetPasswordLink = true;
  isChecked: boolean = false;

  toggleLogin() {
    this.showLogin = !this.showLogin;
    if (this.showLogin) {
      this.showAvatarSelection = false;
      this.showSignup = false;
      this.showResetPassword = false;
      this.showResetPasswordLink = false;
    }
  }

  toggleSignup() {
    this.showSignup = !this.showSignup;
    if (this.showSignup) {
      this.showAvatarSelection = false;
      this.showResetPassword = false;
      this.showResetPasswordLink = false;
    }
  }

  toggleAvatarSelection() {
    this.showAvatarSelection = true;
    this.showSignup = false;
    this.showResetPasswordLink = false;
  }

  toggleResetPassword() {
    this.showResetPassword = true;
    this.showSignup = false;
    this.showAvatarSelection = false;
    this.showResetPasswordLink = false;
  }

  toggleResetPasswordLink() {
    this.showResetPasswordLink = true;
    this.showResetPassword = false;
    this.showSignup = false;
    this.showAvatarSelection = false;
    this.showResetPassword = false;
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
    } else if (
      this.showResetPasswordLink &&
      !this.showResetPassword &&
      !this.showSignup &&
      !this.showAvatarSelection
    ) {
      return '423px';
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
    } else if (
      this.showResetPasswordLink &&
      !this.showResetPassword &&
      !this.showSignup &&
      !this.showAvatarSelection
    ) {
      return '692px';
    } else {
      return '606px';
    }
  }

  shouldShowLogin(): boolean {
    return (
      !this.showSignup &&
      !this.showAvatarSelection &&
      !this.showResetPassword &&
      !this.showResetPasswordLink
    );
  }

  shouldShowSignup(): boolean {
    return (
      this.showSignup &&
      !this.showAvatarSelection &&
      !this.showResetPassword &&
      !this.showResetPasswordLink
    );
  }

  shouldShowAvatarSelection(): boolean {
    return this.showAvatarSelection;
  }

  shouldShowResetPassword(): boolean {
    return this.showResetPassword && !this.showAvatarSelection;
  }

  shouldShowResetPasswordLink(): boolean {
    return this.showResetPasswordLink && !this.showAvatarSelection;
  }

  focused: { [key: string]: boolean } = {
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  };

  onFocus(inputType: string): void {
    this.focused[inputType] = true;
  }

  onBlur(inputType: string): void {
    this.focused[inputType] = false;
  }
}
