import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FocusService {
  constructor() {}

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
