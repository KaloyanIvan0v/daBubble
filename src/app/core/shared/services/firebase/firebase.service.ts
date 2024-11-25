import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Firestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  CollectionReference,
  docData,
  getDocs,
  deleteDoc,
  orderBy,
  query,
  setDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { where, getDoc } from 'firebase/firestore';
import { AuthService } from '../auth-services/auth.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServicesService implements OnDestroy {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);

  private dataSubjects: Map<string, BehaviorSubject<any>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();
  private userUIDSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    this.authService.getCurrentUserUID().then((uid) => {
      this.userUIDSubject.next(uid);
    });
  }

  ngOnDestroy(): void {
    this.dataSubjects.forEach((subject) => subject.complete());
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.dataSubjects.clear();
  }

  public setUserUID(uid: string | null): void {
    this.userUIDSubject.next(uid);
  }

  private getCollectionRef(collectionName: string): CollectionReference {
    return collection(this.firestore, collectionName);
  }

  private getDocRef(collectionName: string, docId: string) {
    return doc(this.firestore, collectionName, docId);
  }

  private mapDocumentData<T>(doc: any): T & { id: string } {
    const data = doc.data() as T;
    return { ...data, id: doc.id };
  }

  getMessages(collectionName: string, docId: string): Observable<Message[]> {
    const messagesCollectionRef = collection(
      this.firestore,
      `${collectionName}/${docId}/messages`
    );

    const q = query(messagesCollectionRef, orderBy('time'));

    return new Observable<Message[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map((doc) =>
            this.mapDocumentData<Message>(doc)
          );
          observer.next(messages);
        },
        (error) => {
          observer.error(`Error fetching messages: ${error}`);
        }
      );

      return () => unsubscribe();
    });
  }

  getThreadMessages(threadPath: string): Observable<Message[]> {
    const threadMessagesCollectionRef = collection(this.firestore, threadPath);

    const q = query(threadMessagesCollectionRef, orderBy('time'));

    return new Observable<Message[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map((doc) =>
            this.mapDocumentData<Message>(doc)
          );
          observer.next(messages);
        },
        (error) => {
          observer.error(`Error fetching thread messages: ${error}`);
        }
      );

      return () => unsubscribe();
    });
  }

  async sendMessage(messagePath: string, message: Message) {
    const messageDocRef = doc(this.firestore, messagePath);
    await setDoc(messageDocRef, message);
  }

  async sendThreadMessage(
    collectionName: string,
    docId: string,
    messageId: string,
    threadMessage: Message
  ) {
    // Referenz zur Thread-Nachricht unter der Hauptnachricht
    const threadMessageDocRef = doc(
      this.firestore,
      `${collectionName}/${docId}/messages/${messageId}/thread/messages/${threadMessage.id}`
    );

    // Thread-Nachricht in Firestore speichern
    await setDoc(threadMessageDocRef, threadMessage);
  }

  async updateMessage(
    messagePath: string,
    data: Partial<Message>
  ): Promise<void> {
    const messageDocRef = doc(this.firestore, messagePath);
    return updateDoc(messageDocRef, data);
  }

  async deleteMessage(
    collectionName: string,
    docId: string,
    messageId: string
  ): Promise<void> {
    const messageDocRef = doc(
      this.firestore,
      `${collectionName}/${docId}/messages/${messageId}`
    );
    return deleteDoc(messageDocRef);
  }

  getCollection<T>(
    collectionName: string,
    uidAccess: boolean
  ): Observable<T[]> {
    const refCollection = this.getCollectionRef(collectionName);

    return this.userUIDSubject.pipe(
      switchMap((uid) => {
        const userSpecificQuery =
          uidAccess && uid
            ? query(refCollection, where('uid', 'array-contains', uid))
            : refCollection;
        return new Observable<T[]>((observer) => {
          const unsubscribe = onSnapshot(
            userSpecificQuery,
            (snapshot) => {
              const data = snapshot.docs.map((doc) =>
                this.mapDocumentData<T>(doc)
              );
              observer.next(data);
            },
            (error) => {
              observer.error(
                `Error fetching collection ${collectionName}: ${error}`
              );
            }
          );
          return () => {
            unsubscribe();
          };
        });
      })
    );
  }

  getDoc<T>(collectionName: string, docId: string): Observable<T> {
    const cacheKey = `${collectionName}-${docId}`;

    if (!this.dataSubjects.has(cacheKey)) {
      const subject = new BehaviorSubject<T | null>(null);
      this.dataSubjects.set(cacheKey, subject);

      const docRef = this.getDocRef(collectionName, docId);

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = this.mapDocumentData<T>(snapshot);
            subject.next(data);
          } else {
            subject.next(null);
          }
        },
        (error) => {
          subject.error(`Error fetching document ${docId}: ${error}`);
        }
      );

      this.unsubscribeFunctions.set(cacheKey, unsubscribe);
    }

    return this.dataSubjects.get(cacheKey)!.asObservable();
  }

  async getDocOnce(collectionName: string, docId: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, `${collectionName}/${docId}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log('No such document!');
        return undefined;
      }
    } catch (error) {
      console.error('Error getting document:', error);
      return undefined;
    }
  }

  async addDoc<T extends { [x: string]: any }>(
    collectionName: string,
    data: T
  ): Promise<string> {
    const collectionRef = this.getCollectionRef(collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  }

  async updateDoc<T>(
    collectionName: string,
    docId: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = this.getDocRef(collectionName, docId);
    return updateDoc(docRef, data);
  }

  getUsers(): Observable<any> {
    return this.getCollection('users', false);
  }

  getChannels(): Observable<any> {
    return this.getCollection('channels', true);
  }

  getChats(): Observable<any> {
    return this.getCollection('chats', true);
  }

  getUser(uid: string): Observable<any> {
    return this.getDoc('users', uid);
  }

  getChannel(channelId: string): Observable<Channel> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
    return docData<Channel>(channelDocRef);
  }

  getChat(id: string): Observable<any> {
    return this.getDoc('chats', id);
  }

  getUniqueId() {
    const id = doc(collection(this.firestore, 'dummyCollection')).id;
    return id;
  }

  private getDocs(q: any): Observable<any[]> {
    return new Observable((observer) => {
      getDocs(q)
        .then((snapshot) => {
          const results = snapshot.docs.map((doc) => doc.data());
          observer.next(results);
        })
        .catch((error) => observer.error(error));
    });
  }

  searchUsers(queryText: string): Observable<any[]> {
    const usersRef = collection(this.firestore, 'users');
    const lowerCaseQuery = queryText.trim().toLowerCase();

    if (queryText.startsWith('@')) {
      const username = queryText.slice(1).toLowerCase();
      return this.searchByUsername(usersRef, username);
    }
    // Search by email
    else if (this.isEmail(queryText)) {
      const email = queryText.toLowerCase();
      return this.searchByEmail(usersRef, email);
    } else {
      return this.searchByEmailPrefix(usersRef, lowerCaseQuery);
    }
  }

  private searchByEmailPrefix(
    usersRef: CollectionReference,
    emailPrefix: string
  ): Observable<any[]> {
    const q = query(
      usersRef,
      where('email', '>=', emailPrefix),
      where('email', '<=', emailPrefix + '\uf8ff')
    );
    return this.getDocs(q);
  }

  isEmail(queryText: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*$/;
    return emailPattern.test(queryText);
  }

  private searchByUsername(
    usersRef: CollectionReference,
    username: string
  ): Observable<any[]> {
    const q = query(
      usersRef,
      where('name', '>=', username),
      where('name', '<=', username + '\uf8ff')
    );
    return this.getDocs(q);
  }

  private searchByEmail(
    usersRef: CollectionReference,
    email: string
  ): Observable<any[]> {
    const q = query(usersRef, where('email', '==', email));
    return this.getDocs(q);
  }

  searchChannels(queryText: string): Observable<any[]> {
    const lowerCaseQuery = queryText.trim().toLowerCase();
    const channelName = lowerCaseQuery.slice(1);
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(
      channelsRef,
      where('name', '>=', channelName),
      where('name', '<=', channelName + '\uf8ff')
    );
    return this.getDocs(q);
  }
}
