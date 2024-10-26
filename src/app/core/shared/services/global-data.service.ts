import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalDataService {
  private popUpStatesAsSubject = new BehaviorSubject<object>({
    addChannel: false,
    popUpShadow: true,
    userMenu: false,
    workspaceMenu: false,
    addUserToChannel: false,
    editChannel: true,
    ownProfileEdit: false,
    ownProfileView: false,
    profileView: false,
  });

  popUpStates$ = this.popUpStatesAsSubject.asObservable();

  constructor() {}

  openPopUp(popUp: string) {
    const currentState = this.popUpStatesAsSubject.value;
    const newState = {
      ...currentState,
      [popUp]: true,
      popUpShadow: true,
    };
    this.popUpStatesAsSubject.next(newState);
  }

  closePopUp() {
    const currentState = this.popUpStatesAsSubject.value;
    const newState = Object.fromEntries(
      Object.keys(currentState).map((key) => [key, false])
    );
    this.popUpStatesAsSubject.next(newState);
  }
}
