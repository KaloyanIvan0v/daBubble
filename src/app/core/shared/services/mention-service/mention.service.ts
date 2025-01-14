import { Injectable, ElementRef } from '@angular/core';
import { first } from 'rxjs/operators';
import { FirebaseServicesService } from '../../services/firebase/firebase.service';
import { User } from 'src/app/core/shared/models/user.class';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';

@Injectable({
  providedIn: 'root',
})
export class MentionService {
  allChannels: Channel[] = [];

  constructor(private firebaseService: FirebaseServicesService) {}

  /**
   * Loads all channels from the Firebase service and stores them locally.
   */
  loadAllChannels(): void {
    this.firebaseService
      .getAllChannels()
      .pipe(first())
      .subscribe((channels) => (this.allChannels = channels));
  }

  /**
   * Checks for the '@' character in the text and updates relevant states
   * such as displaying the user list and filtering user UIDs based on
   * the matching substring.
   *
   * @param inputData - The input box data containing the message.
   * @param messageTextarea - The textarea element reference.
   * @param mirrorElement - A mirrored element reference used for calculating positions.
   * @param usersUid - An array of user UIDs to filter against.
   * @param setShowUserListTextArea - A function to toggle the display of the user list.
   * @param setFilteredUserUids - A function to set filtered user UIDs.
   * @param setUserListPosition - A function to set the position of the user list.
   */
  async checkForMentionSign(
    inputData: InputBoxData,
    messageTextarea: ElementRef<HTMLTextAreaElement>,
    mirrorElement: ElementRef<HTMLDivElement>,
    usersUid: string[],
    setShowUserListTextArea: (val: boolean) => void,
    setFilteredUserUids: (uids: string[]) => void,
    setUserListPosition: (bottom: number, left: number) => void
  ) {
    const textarea = messageTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const message = inputData.message;

    if (cursorPos === 0 || !message) {
      setShowUserListTextArea(false);
      return;
    }

    const lastAtIndex = message.lastIndexOf('@', cursorPos - 1);
    if (lastAtIndex === -1) {
      setShowUserListTextArea(false);
      return;
    }

    const rawMentionSubstring = message.substring(lastAtIndex + 1, cursorPos);
    if (rawMentionSubstring.length !== rawMentionSubstring.trimEnd().length) {
      setShowUserListTextArea(false);
      return;
    }

    const mentionSubstring = rawMentionSubstring.trim();
    if (
      !mentionSubstring ||
      (await this.isMatchingUser(mentionSubstring, usersUid))
    ) {
      const filteredUids = await this.setFilteredUsers(
        mentionSubstring,
        usersUid
      );
      setFilteredUserUids(filteredUids);

      this.positionMentionList(
        '@',
        messageTextarea,
        mirrorElement,
        lastAtIndex,
        setShowUserListTextArea,
        setUserListPosition
      );
    } else {
      setShowUserListTextArea(false);
    }
  }

  /**
   * Inserts the mentioned user into the message at the correct position.
   *
   * @param inputData - The input box data containing the message.
   * @param user - The user to be mentioned.
   * @param messageTextarea - The textarea element reference.
   */
  addMentionedUser(
    inputData: InputBoxData,
    user: User,
    messageTextarea: ElementRef<HTMLTextAreaElement>
  ) {
    const textarea = messageTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const message = inputData.message;
    const lastAtIndex = message.lastIndexOf('@', cursorPos - 1);

    if (lastAtIndex !== -1) {
      inputData.message =
        message.slice(0, lastAtIndex) +
        '@' +
        user.name +
        ' ' +
        message.slice(cursorPos);
    } else {
      inputData.message += ` @${user.name} `;
    }

    this.setCursorToEnd(textarea);
  }

  /**
   * Checks for the '#' character in the text and updates relevant states
   * such as displaying the channel list and filtering channel UIDs based on
   * the matching substring.
   *
   * @param inputData - The input box data containing the message.
   * @param messageTextarea - The textarea element reference.
   * @param mirrorElement - A mirrored element reference used for calculating positions.
   * @param setShowChannelListTextArea - A function to toggle the display of the channel list.
   * @param setFilteredChannelUids - A function to set filtered channel UIDs.
   * @param setChannelListPosition - A function to set the position of the channel list.
   */
  async checkForChannelSign(
    inputData: InputBoxData,
    messageTextarea: ElementRef<HTMLTextAreaElement>,
    mirrorElement: ElementRef<HTMLDivElement>,
    setShowChannelListTextArea: (val: boolean) => void,
    setFilteredChannelUids: (uids: string[]) => void,
    setChannelListPosition: (bottom: number, left: number) => void
  ) {
    const textarea = messageTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const message = inputData.message;

    if (!cursorPos || !message) {
      setShowChannelListTextArea(false);
      return;
    }

    const lastHashIndex = message.lastIndexOf('#', cursorPos - 1);
    if (lastHashIndex === -1) {
      setShowChannelListTextArea(false);
      return;
    }

    const rawSubstring = message.substring(lastHashIndex + 1, cursorPos);
    if (rawSubstring.length !== rawSubstring.trimEnd().length) {
      setShowChannelListTextArea(false);
      return;
    }

    const channelSubstring = rawSubstring.trim();
    if (!channelSubstring || (await this.isMatchingChannel(channelSubstring))) {
      const filteredChannels = this.filterChannels(channelSubstring);
      setFilteredChannelUids(filteredChannels.map((c) => c.id));

      this.positionMentionList(
        '#',
        messageTextarea,
        mirrorElement,
        lastHashIndex,
        setShowChannelListTextArea,
        setChannelListPosition
      );
    } else {
      setShowChannelListTextArea(false);
    }
  }

  /**
   * Inserts the mentioned channel into the message at the correct position.
   *
   * @param inputData - The input box data containing the message.
   * @param selectedChannelId - The ID of the channel to be mentioned.
   * @param messageTextarea - The textarea element reference.
   */
  addMentionedChannel(
    inputData: InputBoxData,
    selectedChannelId: string,
    messageTextarea: ElementRef<HTMLTextAreaElement>
  ) {
    const channel = this.allChannels.find((ch) => ch.id === selectedChannelId);
    if (!channel) return;

    const textarea = messageTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const message = inputData.message;
    const lastHashIndex = message.lastIndexOf('#', cursorPos - 1);

    if (lastHashIndex !== -1) {
      inputData.message =
        message.slice(0, lastHashIndex) +
        '#' +
        channel.name +
        ' ' +
        message.slice(cursorPos);
    } else {
      inputData.message += ` #${channel.name} `;
    }

    this.setCursorToEnd(textarea);
  }

  /**
   * Loads an array of user objects from given UIDs.
   *
   * @param uids - An array of user UIDs.
   * @returns A promise that resolves to an array of User objects.
   */
  loadUsersFromUids(uids: string[]): Promise<User[]> {
    const userPromises = uids.map(async (uid) =>
      this.firebaseService
        .getUser(uid)
        .pipe(first())
        .toPromise()
        .then((user) => user as User)
    );
    return Promise.all(userPromises);
  }

  /**
   * Filters users by a given partial name and returns an array of matching user UIDs.
   *
   * @param partialName - The partial string to match against user names.
   * @param usersUid - An array of user UIDs to be searched.
   * @returns A promise that resolves to an array of matching user UIDs.
   * @private
   */
  private async setFilteredUsers(
    partialName: string,
    usersUid: string[]
  ): Promise<string[]> {
    const allUsers = await this.loadUsersFromUids(usersUid);
    const validUsers = this.filterUsersByName(allUsers, partialName);
    return validUsers.map((u) => u.uid);
  }

  /**
   * Filters an array of User objects by a given partial name.
   *
   * @param users - An array of User objects to be filtered.
   * @param partialName - The partial string to match against user names.
   * @returns An array of User objects whose names start with the given partial name.
   * @private
   */
  private filterUsersByName(users: User[], partialName: string): User[] {
    const lower = partialName.toLowerCase();
    return users.filter((u) => u.name?.toLowerCase().startsWith(lower));
  }

  /**
   * Checks if any user name starts with a given partial name.
   *
   * @param partialName - The partial string to match against user names.
   * @param usersUid - An array of user UIDs to be searched.
   * @returns A promise that resolves to true if a user matches, otherwise false.
   * @private
   */
  private async isMatchingUser(
    partialName: string,
    usersUid: string[]
  ): Promise<boolean> {
    if (!partialName) return false;
    const allUsers = await this.loadUsersFromUids(usersUid);
    return allUsers.some((user) =>
      user.name?.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  /**
   * Filters the locally stored channels by a given partial name.
   *
   * @param partialName - The partial string to match against channel names.
   * @returns An array of Channel objects whose names start with the given partial name.
   * @private
   */
  private filterChannels(partialName: string): Channel[] {
    const lower = partialName.toLowerCase();
    return this.allChannels.filter((ch) =>
      ch.name.toLowerCase().startsWith(lower)
    );
  }

  /**
   * Checks if any channel name starts with a given partial name.
   *
   * @param partialName - The partial string to match against channel names.
   * @returns A promise that resolves to true if a channel matches, otherwise false.
   * @private
   */
  private async isMatchingChannel(partialName: string): Promise<boolean> {
    if (!partialName) return false;
    return this.allChannels.some((ch) =>
      ch.name.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  /**
   * Positions the mention list (users or channels) near the character '@' or '#'
   * by calculating the cursor position within the mirrored element.
   *
   * @param char - The character ('@' or '#') to be positioned around.
   * @param messageTextarea - The textarea element reference.
   * @param mirrorElement - A mirrored element reference used for calculating positions.
   * @param symbolIndex - The index of the mention symbol in the message string.
   * @param onShow - A function to toggle the display of the mention list.
   * @param setPosition - A function to set the position of the mention list.
   * @private
   */
  private positionMentionList(
    char: '@' | '#',
    messageTextarea: ElementRef<HTMLTextAreaElement>,
    mirrorElement: ElementRef<HTMLDivElement>,
    symbolIndex: number,
    onShow: (val: boolean) => void,
    setPosition: (bottom: number, left: number) => void
  ) {
    const textarea = messageTextarea.nativeElement;
    const mirror = mirrorElement.nativeElement;

    mirror.textContent = textarea.value.substring(0, symbolIndex);
    const marker = this.createMarker(char);
    mirror.appendChild(marker);

    const containerRect = textarea.parentElement?.getBoundingClientRect();
    if (containerRect) {
      const markerRect = marker.getBoundingClientRect();

      const bottom = markerRect.bottom - containerRect.bottom + 100;
      const left = markerRect.left - containerRect.left;

      setPosition(bottom, left);
      onShow(true);
    } else {
      onShow(false);
    }
  }

  /**
   * Creates a highlighted marker element for the mention symbol.
   *
   * @param char - The character ('@' or '#') to be displayed in the marker.
   * @returns A span element serving as the marker.
   * @private
   */
  private createMarker(char: string): HTMLSpanElement {
    const marker = document.createElement('span');
    marker.textContent = char;
    marker.style.backgroundColor = 'yellow';
    return marker;
  }

  /**
   * Moves the cursor focus to the end of the textarea content.
   *
   * @param textarea - The textarea element whose cursor should be moved to the end.
   * @private
   */
  private setCursorToEnd(textarea: HTMLTextAreaElement) {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }
}
