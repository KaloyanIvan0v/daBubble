import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Observable } from 'rxjs';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Router } from '@angular/router';
import { setDoc } from '@angular/fire/firestore';
import { User } from 'src/app/core/shared/models/user.class';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss',
})
export class ProfileViewComponent {
  userData$!: Observable<User>;
  currentLoggedInUser!: User;

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private authService: AuthService,
    private router: Router
  ) {
    effect(() => {
      this.userData$ = this.firebaseService.getUser(
        this.workspaceService.currentActiveUserId()
      );
    });
    this.initializeCurrentUser();
  }

  /**
   * Initializes the current logged-in user by fetching their UID and subscribing to their data.
   */
  async initializeCurrentUser() {
    try {
      const userId = await this.authService.getCurrentUserUID();
      if (userId) {
        this.subscribeToUserData(userId);
      }
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  /**
   * Handles errors during user initialization.
   * @param {any} error - The error encountered.
   */
  private handleInitializationError(error: any) {
    console.error('Error loading the logged-in user:', error);
  }

  /**
   * Subscribes to the user data based on the provided user ID.
   * @param {string} userId - The UID of the user to subscribe to.
   */
  private subscribeToUserData(userId: string) {
    this.firebaseService.getUser(userId).subscribe((user) => {
      this.currentLoggedInUser = user;
    });
  }

  /**
   * Closes the profile view popup.
   */
  closePopUp() {
    this.workspaceService.profileViewPopUp.set(false);
  }

  /**
   * Retrieves the visibility status of the profile view popup.
   * @returns {boolean} - True if the popup is visible, otherwise false.
   */
  get popUpVisible(): boolean {
    return this.workspaceService.profileViewPopUp();
  }

  /**
   * Initiates the chat opening process by handling user data and chat creation.
   */
  openChat() {
    this.userData$.subscribe((selectedUser) => {
      if (!this.isUserDataValid(selectedUser)) {
        console.warn('Profile user or current user not available!');
        return;
      }
      this.prepareChat(selectedUser);
    });
  }

  /**
   * Validates the selected user and current logged-in user data.
   * @param {User} selectedUser - The user selected for chat.
   * @returns {boolean} - True if both users are valid, otherwise false.
   */
  private isUserDataValid(selectedUser: User): boolean {
    return !!selectedUser && !!this.currentLoggedInUser;
  }

  /**
   * Prepares the necessary data and handles chat creation between users.
   * @param {User} selectedUser - The user selected for chat.
   */
  private async prepareChat(selectedUser: User) {
    const { senderId, receiverId, senderData, receiverData } =
      this.extractChatParticipants(selectedUser);

    await this.handleChatCreation(
      senderId,
      receiverId,
      senderData,
      receiverData
    );
    this.closePopUp();
    this.workspaceService.channelMembersPopUp.set(false);
  }

  /**
   * Extracts chat participant data.
   * @param {User} selectedUser - The user selected for chat.
   * @returns {{
   *   senderId: string;
   *   receiverId: string;
   *   senderData: { uid: string; name: string; photoURL: string };
   *   receiverData: { uid: string; name: string; photoURL: string };
   * }} - The extracted participant data.
   */
  private extractChatParticipants(selectedUser: User) {
    const senderId = this.currentLoggedInUser!.uid;
    const receiverId = selectedUser.uid;

    const senderData = this.extractUserData(this.currentLoggedInUser);
    const receiverData = this.extractUserData(selectedUser);

    return { senderId, receiverId, senderData, receiverData };
  }

  /**
   * Extracts relevant user data for chat creation.
   * @param {User} user - The user object.
   * @returns {{ uid: string; name: string; photoURL: string }} - The extracted user data.
   */
  private extractUserData(user: User): {
    uid: string;
    name: string;
    photoURL: string;
  } {
    return {
      uid: user.uid,
      name: user.name || 'Unnamed',
      photoURL: user.photoURL || '',
    };
  }

  /**
   * Handles the creation or navigation to a chat between two users.
   * @param {string} senderId - The UID of the sender.
   * @param {string} receiverId - The UID of the receiver.
   * @param {{ uid: string; name: string; photoURL: string }} senderData - Sender's data.
   * @param {{ uid: string; name: string; photoURL: string }} receiverData - Receiver's data.
   */
  private async handleChatCreation(
    senderId: string,
    receiverId: string,
    senderData: { uid: string; name: string; photoURL: string },
    receiverData: { uid: string; name: string; photoURL: string }
  ): Promise<void> {
    const chatId = this.generateChatId(senderId, receiverId);
    const chatExists = await this.checkChatExists(chatId);

    if (chatExists) {
      this.navigateToChat(chatId);
    } else {
      await this.createChatDocument(chatId, senderData, receiverData);
      this.navigateToChat(chatId);
    }
  }

  /**
   * Generates a unique chat ID based on sender and receiver IDs.
   * @param {string} senderId - The UID of the sender.
   * @param {string} receiverId - The UID of the receiver.
   * @returns {string} - The generated chat ID.
   */
  private generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  /**
   * Checks if a chat with the specified ID already exists.
   * @param {string} chatId - The ID of the chat to check.
   * @returns {Promise<boolean>} - True if the chat exists, otherwise false.
   */
  private async checkChatExists(chatId: string): Promise<boolean> {
    try {
      return await this.firebaseService.checkDocExists(
        'directMessages',
        chatId
      );
    } catch (error) {
      this.handleChatExistenceError(error);
      return false;
    }
  }

  /**
   * Handles errors during chat existence check.
   * @param {any} error - The error encountered.
   */
  private handleChatExistenceError(error: any) {
    console.error('Error checking chat existence:', error);
  }

  /**
   * Creates a new chat document in the Firestore database.
   * @param {string} chatId - The ID of the chat to create.
   * @param {{ uid: string; name: string; photoURL: string }} senderData - Sender's data.
   * @param {{ uid: string; name: string; photoURL: string }} receiverData - Receiver's data.
   */
  private async createChatDocument(
    chatId: string,
    senderData: { uid: string; name: string; photoURL: string },
    receiverData: { uid: string; name: string; photoURL: string }
  ): Promise<void> {
    const chatData = this.constructChatData(chatId, senderData, receiverData);
    await this.saveChatDocument(chatId, chatData);
  }

  /**
   * Constructs the chat data object.
   * @param {string} chatId - The ID of the chat.
   * @param {{ uid: string; name: string; photoURL: string }} senderData - Sender's data.
   * @param {{ uid: string; name: string; photoURL: string }} receiverData - Receiver's data.
   * @returns {{
   *   uid: string[];
   *   id: string;
   *   timestamp: Date;
   *   sender: { uid: string; name: string; photoURL: string };
   *   receiver: { uid: string; name: string; photoURL: string };
   * }} - The constructed chat data.
   */
  private constructChatData(
    chatId: string,
    senderData: { uid: string; name: string; photoURL: string },
    receiverData: { uid: string; name: string; photoURL: string }
  ) {
    return {
      uid: [senderData.uid, receiverData.uid],
      id: chatId,
      timestamp: new Date(),
      sender: senderData,
      receiver: receiverData,
    };
  }

  /**
   * Saves the chat document to Firestore.
   * @param {string} chatId - The ID of the chat.
   * @param {object} chatData - The data of the chat.
   */
  private async saveChatDocument(chatId: string, chatData: any) {
    try {
      await setDoc(
        this.firebaseService.getDocRef('directMessages', chatId),
        chatData
      );
    } catch (error) {
      this.handleChatCreationError(error);
      throw error;
    }
  }

  /**
   * Handles errors during chat document creation.
   * @param {any} error - The error encountered.
   */
  private handleChatCreationError(error: any) {
    console.error('Error creating chat document:', error);
  }

  /**
   * Navigates the user to the specified chat interface.
   * @param {string} chatId - The ID of the chat to navigate to.
   */
  private navigateToChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
    this.workspaceService.currentActiveUnitId.set(chatId);
  }
}
