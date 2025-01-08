// input-box.helper.ts

import { FirebaseServicesService } from '../../services/firebase/firebase.service';
import { first } from 'rxjs/operators';
import { User } from 'src/app/core/shared/models/user.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { MainService } from 'src/app/core/shared/services/main-service/main.service';

/**
 * Helper class for InputBoxComponent functionalities.
 */
export class InputBoxHelper {
  constructor(
    private firebaseService: FirebaseServicesService,
    private mainService: MainService
  ) {}

  /**
   * Initializes the placeholder based on the current context.
   */
  initializePlaceholder(
    space: string,
    receiverId: string | null,
    messagePath: string,
    channelNameSignal: any,
    placeholderSignal: any,
    firebaseService: FirebaseServicesService
  ): void {
    const spaceHandlers: { [key: string]: () => void } = {
      'new chat': () =>
        this.setPlaceholderText('Start a new message', placeholderSignal),
      directChat: () =>
        this.setReceiverPlaceholder(receiverId, placeholderSignal),
      channel: () =>
        this.setChannelPlaceholder(
          messagePath,
          channelNameSignal,
          placeholderSignal
        ),
      thread: () => this.setPlaceholderText('Reply...', placeholderSignal),
      default: () =>
        this.setPlaceholderText('Type your message here...', placeholderSignal),
    };
    (spaceHandlers[space] || spaceHandlers['default'])();
  }

  private setPlaceholderText(text: string, placeholderSignal: any): void {
    placeholderSignal.set(text);
  }

  private setReceiverPlaceholder(
    receiverId: string | null,
    placeholderSignal: any
  ): void {
    if (receiverId) {
      this.fetchReceiverName(receiverId, placeholderSignal);
    } else {
      this.setPlaceholderText('Type your message here...', placeholderSignal);
    }
  }

  private fetchReceiverName(receiverId: string, placeholderSignal: any): void {
    this.firebaseService
      .getUser(receiverId)
      .pipe(first())
      .subscribe((user) => {
        if (user) {
          placeholderSignal.set(`Message to ${user.name}`);
        }
      });
  }

  private setChannelPlaceholder(
    messagePath: string,
    channelNameSignal: any,
    placeholderSignal: any
  ): void {
    const channelId = this.extractChannelId(messagePath);
    if (channelId) {
      this.fetchChannelName(channelId, channelNameSignal, placeholderSignal);
    } else {
      this.setPlaceholderText('Type your message here...', placeholderSignal);
    }
  }

  private fetchChannelName(
    channelId: string,
    channelNameSignal: any,
    placeholderSignal: any
  ): void {
    this.firebaseService
      .getChannel(channelId)
      .pipe(first())
      .subscribe((channel) => {
        if (channel) {
          channelNameSignal.set(channel.name);
          placeholderSignal.set(`Message to #${channel.name}`);
        }
      });
  }

  private extractChannelId(messagePath: string): string | null {
    const parts = messagePath.split('/');
    return parts.length > 2 ? parts[2] : null;
  }

  /**
   * Sends a new message.
   */
  sendNewMessage(
    mainService: MainService,
    messagePath: string,
    inputData: InputBoxData,
    receiverId: string | null
  ): void {
    mainService.sendMessage(messagePath, inputData, receiverId);
  }

  /**
   * Updates an existing message.
   */
  updateEditedMessage(
    mainService: MainService,
    messageToEdit: Message | undefined,
    inputData: InputBoxData
  ): void {
    if (messageToEdit) {
      messageToEdit.value.text = inputData.message;
      mainService.updateMessage(messageToEdit);
    }
  }

  /**
   * Fetches users based on UIDs.
   */
  async fetchUsers(
    firebaseService: FirebaseServicesService,
    uids: string[]
  ): Promise<User[]> {
    const userPromises = uids.map((uid) =>
      firebaseService.getUser(uid).pipe(first()).toPromise()
    );
    const users = await Promise.all(userPromises);
    return users.filter((user): user is User => !!user);
  }

  /**
   * Filters users by name.
   */
  filterUsersByName(users: User[], partialName: string): User[] {
    const lower = partialName.toLowerCase();
    return users.filter((user) => user?.name?.toLowerCase().startsWith(lower));
  }

  /**
   * Extracts UIDs from users.
   */
  extractUserUids(users: User[]): string[] {
    return users.map((user) => user.uid);
  }

  /**
   * Handles errors by logging them.
   */
  handleError(message: string, error: any): void {
    console.error(message, error);
  }

  /**
   * Checks if a partial name matches any user's name.
   * @param {string} partialName - The partial name to check.
   * @returns {Promise<boolean>} - True if a matching user is found, otherwise false.
   */
  async isMatchingUser(partialName: string): Promise<boolean> {
    if (!partialName) return false;
    const userUids = await this.getAllUserUids();
    const users = await this.fetchUsers(this.firebaseService, userUids);
    return users.some((user) =>
      user?.name?.toLowerCase().startsWith(partialName.toLowerCase())
    );
  }

  async getAllUserUids(): Promise<string[]> {
    const users = await this.firebaseService
      .getUsers()
      .pipe(first())
      .toPromise();
    return users!.map((user: User) => user.uid);
  }

  /**
   * Sets the filtered user UIDs based on the partial name.
   * @param {string} partialName - The partial name to filter users.
   * @param {string[]} usersUid - The list of user UIDs to filter from.
   * @returns {Promise<string[]>} - The filtered list of user UIDs.
   */
  async setFilteredUsers(
    partialName: string,
    usersUid: string[]
  ): Promise<string[]> {
    const users = await this.fetchUsers(this.firebaseService, usersUid);
    const filteredUsers = this.filterUsersByName(users, partialName);
    return this.extractUserUids(filteredUsers);
  }
}
