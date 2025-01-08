import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  constructor() {}

  /**
   * Stores a value in the session storage.
   * @param key The key to store the value under.
   * @param value The value to store. This can be any type supported by JSON.
   */
  setItem(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieves a value from session storage.
   * @param key The key corresponding to the value to retrieve.
   * @returns The parsed value associated with the key, or null if the key does not exist.
   */

  getItem<T>(key: string): T | null {
    const data = sessionStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  /**
   * Removes a value from session storage.
   * @param key The key corresponding to the value to remove.
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Removes all values from session storage.
   */
  clear(): void {
    sessionStorage.clear();
  }
}
