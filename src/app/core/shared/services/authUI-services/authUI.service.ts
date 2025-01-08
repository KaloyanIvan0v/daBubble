import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthUIService {
  constructor() {}

  isChecked: boolean = false;
  showAccountCreated: boolean = false;
  showEmailSent: boolean = false;
  toggleCheckbox() {
    this.isChecked = !this.isChecked;
  }

  focused: { [key: string]: boolean } = {
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  };

  /**
   * Set the focused state of the input to true.
   * @param inputType The type of the input field, e.g. 'name', 'email', etc.
   */
  onFocus(inputType: string): void {
    this.focused[inputType] = true;
  }

  /**
   * Set the focused state of the input to false.
   * @param inputType The type of the input field, e.g. 'name', 'email', etc.
   */
  onBlur(inputType: string): void {
    this.focused[inputType] = false;
  }
}
