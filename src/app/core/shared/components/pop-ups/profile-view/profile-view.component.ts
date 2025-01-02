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
  currentLoggedInUser: User | null = null;

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
    this.setCurrentLoggedInUser();
  }

  async setCurrentLoggedInUser() {
    try {
      const loggedInUserId = await this.authService.getCurrentUserUID();
      if (loggedInUserId) {
        this.firebaseService.getUser(loggedInUserId).subscribe((user) => {
          this.currentLoggedInUser = user;
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des eingeloggten Benutzers:', error);
    }
  }

  closePopUp() {
    this.workspaceService.profileViewPopUp.set(false);
  }

  get popUpVisible() {
    return this.workspaceService.profileViewPopUp();
  }

  openChat() {
    this.userData$.subscribe(async (selectedUser) => {
      if (!selectedUser || !this.currentLoggedInUser) {
        console.warn('Profil-User oder aktueller User nicht vorhanden!');
        return;
      }

      const senderId = this.currentLoggedInUser.uid;
      const receiverId = selectedUser.uid;

      const senderData = {
        uid: this.currentLoggedInUser.uid,
        name: this.currentLoggedInUser.name || 'Sender Name',
        photoURL: this.currentLoggedInUser.photoURL || '',
      };

      const receiverData = {
        uid: selectedUser.uid,
        name: selectedUser.name,
        photoURL: selectedUser.photoURL,
      };
      await this.handleChatCreation(
        senderId,
        receiverId,
        senderData,
        receiverData
      );
      this.closePopUp();
      this.workspaceService.channelMembersPopUp.set(false);
    });
  }

  private async handleChatCreation(
    senderId: string,
    receiverId: string,
    senderData: { uid: string; name: string; photoURL: string },
    receiverData: { uid: string; name: string; photoURL: string }
  ): Promise<void> {
    const chatId = this.generateChatId(senderId, receiverId);

    try {
      const exists = await this.checkChatExists(chatId);
      if (exists) {
        this.navigateToChat(chatId);
      } else {
        await this.createChatDocument(chatId, senderData, receiverData);
        this.navigateToChat(chatId);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen/Öffnen des Chats:', error);
    }
  }

  private generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  private async checkChatExists(chatId: string): Promise<boolean> {
    try {
      return await this.firebaseService.checkDocExists(
        'directMessages',
        chatId
      );
    } catch (error) {
      console.error('Fehler bei der Chat-Existenzprüfung:', error);
      return false;
    }
  }

  private async createChatDocument(
    chatId: string,
    senderData: { uid: string; name: string; photoURL: string },
    receiverData: { uid: string; name: string; photoURL: string }
  ): Promise<void> {
    const chatData = {
      uid: [senderData.uid, receiverData.uid],
      id: chatId,
      timestamp: new Date(),
      sender: senderData,
      receiver: receiverData,
    };

    try {
      await setDoc(
        this.firebaseService.getDocRef('directMessages', chatId),
        chatData
      );
    } catch (error) {
      console.error('Fehler beim Erstellen des Chat-Dokuments:', error);
      throw error;
    }
  }

  private navigateToChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
    this.workspaceService.currentActiveUnitId.set(chatId);
  }
}
