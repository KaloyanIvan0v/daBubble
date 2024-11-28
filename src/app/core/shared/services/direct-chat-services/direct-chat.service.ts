import { Injectable } from '@angular/core';
import { FirebaseServicesService } from '../firebase/firebase.service';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { DirectMessage } from '../../models/direct-message.class';

@Injectable({
  providedIn: 'root',
})
export class DirectChatService {
  private subscription: Subscription | undefined;
  directChats: BehaviorSubject<DirectMessage[]> = new BehaviorSubject<
    DirectMessage[]
  >([]);
  chatUserData = new BehaviorSubject<any>([]);

  constructor(public firebaseService: FirebaseServicesService) {}

  getChats() {
    this.subscription = this.firebaseService
      .getDirectChats()
      .subscribe((chats) => {
        this.directChats.next(chats);
        this.loadChatUser(chats);
      });
  }

  async loadChatUser(chats: DirectMessage[]) {
    const userDataPromises = chats.map(async (chat) => {
      const uid = chat.recipientUid;
      if (uid) {
        const user = await this.firebaseService.getUser(uid).toPromise();
        return {
          ...chat,
          user,
        };
      }
      return chat;
    });

    const updatedChats = await Promise.all(userDataPromises);
    this.chatUserData.next(updatedChats);
  }
}
