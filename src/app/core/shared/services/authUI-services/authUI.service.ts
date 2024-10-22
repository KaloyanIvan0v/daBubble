import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthUIService {
  constructor() {}

  showSignup = false;

  toggleSignup() {
    this.showSignup = !this.showSignup;
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
