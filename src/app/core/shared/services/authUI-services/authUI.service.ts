import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthUIService {
  constructor() {}

  showSignup = false;
  showAvatarSelection = true;
  isChecked: boolean = false;

  toggleSignup() {
    this.showSignup = !this.showSignup;
  }

  toggleAvatarSelection() {
    this.showAvatarSelection = true;
  }

  toggleCheckbox() {
    this.isChecked = !this.isChecked;
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
