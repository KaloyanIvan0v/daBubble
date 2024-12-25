import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthUIService {
  constructor() {}

  isChecked: boolean = false;
  showAccountCreated: boolean = false;

  toggleCheckbox() {
    this.isChecked = !this.isChecked;
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
