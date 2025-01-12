import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';
import { User } from 'src/app/core/shared/models/user.class';
import { FirebaseServicesService } from '../../services/firebase/firebase.service';

@Injectable({
  providedIn: 'root',
})
export class MentionUserService {
  constructor() {}

  /**
   * Checks if the user list should be hidden based on cursor position or empty message.
   * @param {number} cursorPos - The current cursor position.
   * @param {string} message - The entire message string.
   * @returns {boolean} True if the user list should be hidden, false otherwise.
   */
  shouldHideUserList(cursorPos: number, message: string): boolean {
    return cursorPos === 0 || !message;
  }

  /**
   * Finds the last index of '@' before the current cursor position.
   * @param {string} message - The entire message string.
   * @param {number} cursorPos - The current cursor position.
   * @returns {number} Index of the last '@' or -1 if not found.
   */
  getLastAtIndex(message: string, cursorPos: number): number {
    return message.lastIndexOf('@', cursorPos - 1);
  }

  /**
   * Checks if '@' is not found in the string.
   * @param {number} lastAtIndex - The index of the last '@'.
   * @returns {boolean} True if index is invalid, false otherwise.
   */
  invalidAtIndex(lastAtIndex: number): boolean {
    return lastAtIndex === -1;
  }

  /**
   * Checks if there is a trailing space after '@' but before the cursor.
   * @param {string} message - The entire message string.
   * @param {number} lastAtIndex - The index of the last '@'.
   * @param {number} cursorPos - The current cursor position.
   * @returns {boolean} True if the substring contains trailing space, false otherwise.
   */
  containsTrailingSpace(
    message: string,
    lastAtIndex: number,
    cursorPos: number
  ): boolean {
    const raw = message.substring(lastAtIndex + 1, cursorPos);
    return raw.length !== raw.trimEnd().length;
  }

  /**
   * Extracts the substring immediately following '@' up to the cursor position, trimmed.
   * @param {string} message - The entire message string.
   * @param {number} lastAtIndex - The index of the last '@'.
   * @param {number} cursorPos - The current cursor position.
   * @returns {string} The substring after '@' (trimmed).
   */
  getMentionSubstring(
    message: string,
    lastAtIndex: number,
    cursorPos: number
  ): string {
    return message.substring(lastAtIndex + 1, cursorPos).trim();
  }

  /**
   * Checks if the substring (partial name) matches at least one user's name from the given UIDs.
   * @param {string} partialName - The typed partial name to match.
   * @param {FirebaseServicesService} firebaseService - Service to fetch users from Firebase.
   * @param {string[]} usersUid - List of user UIDs.
   * @returns {Promise<boolean>} True if at least one user name starts with partialName.
   */
  async isMatchingUser(
    partialName: string,
    firebaseService: FirebaseServicesService,
    usersUid: string[]
  ): Promise<boolean> {
    if (!partialName) return false;
    const users = await this.getUsersFromUids(usersUid, firebaseService);
    return users.some((user) =>
      user?.name?.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  /**
   * Fetches user data for each UID, returns an array of users.
   * @param {string[]} uids - An array of user UIDs.
   * @param {FirebaseServicesService} firebaseService - Service to fetch from Firebase.
   * @returns {Promise<User[]>} Array of fetched users.
   */
  async getUsersFromUids(
    uids: string[],
    firebaseService: FirebaseServicesService
  ): Promise<User[]> {
    const users: User[] = [];
    for (const uid of uids) {
      const user = await this.fetchUserFromFirebase(uid, firebaseService);
      if (user) users.push(user);
    }
    return users;
  }

  /**
   * Filters an array of users by checking if their names start with partialName.
   * @param {User[]} users - All possible users.
   * @param {string} partialName - The typed substring after '@'.
   * @returns {User[]} Filtered user list matching partialName.
   */
  filterUsers(users: User[], partialName: string): User[] {
    if (!partialName) return users;
    return users.filter((u) =>
      u?.name?.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  /**
   * Creates and returns an HTMLSpanElement to highlight '@' in a message.
   * @returns {HTMLSpanElement} A span element with '@' highlighted.
   */
  createMarker(): HTMLSpanElement {
    const marker = document.createElement('span');
    marker.textContent = '@';
    marker.style.backgroundColor = 'yellow';
    return marker;
  }

  /**
   * Calculates the dropdown position for the user list relative to a marker & container.
   * @param {HTMLSpanElement} marker - The '@' marker in the mirror element.
   * @param {DOMRect} containerRect - The bounding rectangle of the parent container.
   * @returns {{ bottom: number; left: number }} An object with bottom & left offsets.
   */
  calculateUserListPosition(
    marker: HTMLSpanElement,
    containerRect: DOMRect
  ): { bottom: number; left: number } {
    const markerRect = marker.getBoundingClientRect();
    const userListBottom = markerRect.bottom - containerRect.bottom + 100;
    const userListLeft = markerRect.left - containerRect.left;
    return { bottom: userListBottom, left: userListLeft };
  }

  /**
   * Fetches a single user from Firebase by UID (used internally by getUsersFromUids).
   * @private
   * @param {string} uid - The user's UID.
   * @param {FirebaseServicesService} firebaseService - Service to fetch user data.
   * @returns {Promise<User>} The fetched user or null/undefined if not found.
   */
  private async fetchUserFromFirebase(
    uid: string,
    firebaseService: FirebaseServicesService
  ): Promise<User> {
    return (await firebaseService
      .getUser(uid)
      .pipe(first())
      .toPromise()) as User;
  }
}
