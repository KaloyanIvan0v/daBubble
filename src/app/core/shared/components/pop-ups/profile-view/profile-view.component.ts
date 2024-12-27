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
  /**
   * Das Observable für den "Profil-User" (Empfänger).
   * Dieser User wird in workspaceService.currentActiveUserId() verwaltet.
   */
  userData$!: Observable<User>;

  /**
   * Der aktuell eingeloggte User (Absender).
   */
  currentLoggedInUser: User | null = null;

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private authService: AuthService,
    private router: Router
  ) {
    // Effekt, der ausgeführt wird, wenn currentActiveUserId() sich ändert:
    effect(() => {
      this.userData$ = this.firebaseService.getUser(
        this.workspaceService.currentActiveUserId()
      );
    });

    // Direkt beim Erstellen der Komponente versuchen wir,
    // den aktuell eingeloggten User (Absender) zu laden.
    this.setCurrentLoggedInUser();
  }

  /**
   * Lädt den aktuell eingeloggten User in die Variable currentLoggedInUser.
   */
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

  /**
   * Schließt das PopUp (z.B. Overlay für das Profil).
   */
  closePopUp() {
    this.workspaceService.profileViewPopUp.set(false);
  }

  /**
   * Getter, um abzufragen, ob das Profil-PopUp gerade sichtbar ist.
   */
  get popUpVisible() {
    return this.workspaceService.profileViewPopUp();
  }

  /**
   * Wird aufgerufen, wenn der "Nachricht senden" Button geklickt wird.
   * Öffnet oder erstellt einen Direct-Chat zwischen currentLoggedInUser und dem Profil-User.
   */
  openChat() {
    // Wir nutzen das userData$-Observable, um den Profil-User zu erhalten
    this.userData$.subscribe(async (selectedUser) => {
      if (!selectedUser || !this.currentLoggedInUser) {
        console.warn('Profil-User oder aktueller User nicht vorhanden!');
        return;
      }

      const senderId = this.currentLoggedInUser.uid;
      const receiverId = selectedUser.uid;

      // Daten für das Chat-Dokument vorbereiten
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

      // Chat anlegen oder öffnen
      await this.handleChatCreation(
        senderId,
        receiverId,
        senderData,
        receiverData
      );

      // Optional: PopUp schließen, damit man direkt den Chat sieht
      this.closePopUp();
      this.workspaceService.channelMembersPopUp.set(false);
    });
  }

  /**
   * Erzeugt/öffnet einen Chat basierend auf senderId und receiverId.
   */
  private async handleChatCreation(
    senderId: string,
    receiverId: string,
    senderData: { uid: string; name: string; photoURL: string },
    receiverData: { uid: string; name: string; photoURL: string }
  ): Promise<void> {
    // Chat-ID generieren (z.B. user1_user2 oder user2_user1)
    const chatId = this.generateChatId(senderId, receiverId);

    try {
      // Prüfen, ob dieses Dokument (Chat) schon in Firestore existiert
      const exists = await this.checkChatExists(chatId);

      if (exists) {
        // Wenn ja, einfach in den vorhandenen Chat navigieren
        this.navigateToChat(chatId);
      } else {
        // Wenn nein, neues Dokument anlegen und dann navigieren
        await this.createChatDocument(chatId, senderData, receiverData);
        this.navigateToChat(chatId);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen/Öffnen des Chats:', error);
    }
  }

  /**
   * Generiert eine eindeutige Chat-ID anhand der User-IDs.
   */
  private generateChatId(senderId: string, receiverId: string): string {
    return senderId < receiverId
      ? `${senderId}_${receiverId}`
      : `${receiverId}_${senderId}`;
  }

  /**
   * Prüft per Firestore-Abfrage, ob ein Dokument (Chat) existiert.
   */
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

  /**
   * Legt das Chat-Dokument in der Collection "directMessages" an.
   */
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
      // getDocRef(...) sollte eine Methode in deinem FirebaseServicesService sein,
      // die ein DocumentReference-Objekt für 'directMessages/{chatId}' zurückgibt.
      await setDoc(
        this.firebaseService.getDocRef('directMessages', chatId),
        chatData
      );
    } catch (error) {
      console.error('Fehler beim Erstellen des Chat-Dokuments:', error);
      throw error;
    }
  }

  /**
   * Navigiert zum Chat (dashboard/direct-chat/:chatId) und setzt diesen als aktuell aktiven Chat.
   */
  private navigateToChat(chatId: string): void {
    this.router.navigate(['dashboard', 'direct-chat', chatId]);
    this.workspaceService.currentActiveUnitId.set(chatId);
  }
}
