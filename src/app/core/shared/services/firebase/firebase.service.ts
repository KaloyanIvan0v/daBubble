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
  deleteDoc,
  orderBy,
  query,
  setDoc,
  QuerySnapshot,
  DocumentData,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, Observer, switchMap } from 'rxjs';
import { where, getDoc } from 'firebase/firestore';
import { AuthService } from '../auth-services/auth.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from '../../models/user.class';
import { Chat } from '../../models/chat.class';

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

  public getDocRef(collectionName: string, docId: string) {
    return doc(this.firestore, collectionName, docId);
  }

  private mapDocumentData<T>(doc: any): T & { id: string } {
    const data = doc.data() as T;
    return { ...data, id: doc.id };
  }

  /**
   * Zentrale Methode zum Erstellen eines Observables aus einem beliebigen Query.
   * Für die meisten Fälle wird diese Methode intern oder in getOrderedMessages() genutzt.
   */
  private createObservableFromQuery<T>(
    q: any,
    errorMsg: string
  ): Observable<T> {
    return new Observable<T>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const data = snapshot.docs.map((doc) => this.mapDocumentData(doc));
          observer.next(data as unknown as T);
        },
        (error) => observer.error(`${errorMsg}: ${error}`)
      );
      return () => unsubscribe();
    });
  }

  /**
   * Gibt Nachrichten aus einer beliebigen Sub-Collection,
   * z.B. "channels/{id}/messages", sortiert nach 'time', als Observable zurück.
   */
  private getOrderedMessages(path: string): Observable<Message[]> {
    const messagesCollectionRef = collection(this.firestore, path);
    const q = query(messagesCollectionRef, orderBy('time'));
    return new Observable<Message[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const data = snapshot.docs.map((doc) => this.mapDocumentData(doc));
          observer.next(data as Message[]);
        },
        (error) => observer.error(`Error fetching messages: ${error}`)
      );
      return () => unsubscribe();
    });
  }

  /**
   * Wrapper für getOrderedMessages() – holt die Messages für "collectionName/docId/messages".
   */
  getMessages(collectionName: string, docId: string): Observable<Message[]> {
    const path = `${collectionName}/${docId}/messages`;
    return this.getOrderedMessages(path);
  }

  /**
   * Wrapper für getOrderedMessages() – holt die Messages direkt über den threadPath.
   */
  getThreadMessages(threadPath: string): Observable<Message[]> {
    return this.getOrderedMessages(threadPath);
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
    const threadMessageDocRef = doc(
      this.firestore,
      `${collectionName}/${docId}/messages/${messageId}/thread/messages/${threadMessage.id}`
    );
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

  /**
   * Gibt eine Collection als Observable zurück, optional gefiltert nach uid (array-contains).
   */
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
        return this.createCollectionObservable<T>(
          userSpecificQuery,
          collectionName
        );
      })
    );
  }

  private createCollectionObservable<T>(
    userSpecificQuery: any,
    collectionName: string
  ): Observable<T[]> {
    return new Observable<T[]>((observer) => {
      const unsubscribe = onSnapshot(
        userSpecificQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const data = snapshot.docs.map((doc) => this.mapDocumentData<T>(doc));
          observer.next(data);
        },
        (error) =>
          observer.error(
            `Error fetching collection ${collectionName}: ${error}`
          )
      );
      return () => unsubscribe();
    });
  }

  /**
   * Caching-Version von getDoc: Holt ein Dokument als Observable und cacht es in dataSubjects.
   */
  getDoc<T>(collectionName: string, docId: string): Observable<T> {
    const cacheKey = `${collectionName}-${docId}`;
    if (!this.dataSubjects.has(cacheKey)) {
      this.createDocSubject<T>(collectionName, docId, cacheKey);
    }
    return this.dataSubjects.get(cacheKey)!.asObservable();
  }

  private createDocSubject<T>(
    collectionName: string,
    docId: string,
    cacheKey: string
  ): void {
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
      (error) => subject.error(`Error fetching document ${docId}: ${error}`)
    );

    this.unsubscribeFunctions.set(cacheKey, unsubscribe);
  }

  /**
   * Holt ein Dokument einmalig (ohne Observable).
   */
  async getDocOnce(collectionName: string, docId: string): Promise<any> {
    try {
      const docRef = doc(this.firestore, `${collectionName}/${docId}`);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : undefined;
    } catch (error) {
      console.error('Error getting document:', error);
      return undefined;
    }
  }

  /**
   * Fügt ein Dokument in eine Collection ein und gibt die generierte ID zurück.
   */
  async addDoc<T extends { [x: string]: any }>(
    collectionName: string,
    data: T
  ): Promise<string> {
    const collectionRef = this.getCollectionRef(collectionName);
    const docRef = await addDoc(collectionRef, data);
    return docRef.id;
  }

  /**
   * Aktualisiert ein bestehendes Dokument in einer Collection.
   */
  async updateDoc<T>(
    collectionName: string,
    docId: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = this.getDocRef(collectionName, docId);
    return updateDoc(docRef, data);
  }

  /**
   * Beispiele für bequeme Getter verschiedener Collections / Dokumente.
   */
  getUsers(): Observable<any> {
    return this.getCollection('users', false);
  }

  updateUser(uid: string, data: Partial<User>) {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    updateDoc(userDocRef, data);
  }

  getChannels(): Observable<Channel[]> {
    return this.getCollection<Channel>('channels', true);
  }

  getChats(): Observable<Chat[]> {
    return this.getCollection('directMessages', true);
  }

  /**
   * Holt alle Direct-Chats als Observable und resolved die User-Daten.
   */
  getDirectChats(): Observable<any[]> {
    const directMessagesCollection = this.getCollectionRef('directMessages');
    return new Observable<any[]>((observer) => {
      const unsubscribe = this.setupDirectChatsListener(
        directMessagesCollection,
        observer
      );
      return () => unsubscribe();
    });
  }

  private setupDirectChatsListener(
    collectionRef: CollectionReference<DocumentData>,
    observer: Observer<any>
  ): () => void {
    return onSnapshot(
      collectionRef,
      (snapshot) => this.handleSnapshot(snapshot, observer),
      (error) => this.handleSnapshotError(error, observer)
    );
  }

  private async handleSnapshot(
    snapshot: QuerySnapshot<DocumentData>,
    observer: Observer<any>
  ): Promise<void> {
    const chats = await this.processChatSnapshots(snapshot);
    observer.next(chats);
  }

  private handleSnapshotError(error: Error, observer: Observer<any>): void {
    console.error(`Error fetching direct messages: ${error}`);
    observer.error(error);
  }

  /**
   * Verarbeitet jeden Chat-Eintrag und resolved dessen User-Daten über resolveUserData().
   */
  private async processChatSnapshots(
    snapshot: QuerySnapshot<DocumentData>
  ): Promise<any[]> {
    const chatPromises = snapshot.docs.map(async (doc: any) => {
      const chat = this.mapDocumentData<any>(doc);
      return this.resolveUserData(chat);
    });
    return Promise.all(chatPromises);
  }

  /**
   * Öffentliche Methode, um manuell einen Chat (z.B. nach dem Hinzufügen) zu ergänzen.
   */
  async addUserToChat(chat: any): Promise<any> {
    return this.resolveUserData(chat);
  }

  /**
   * Zentrale Methode zum Resolven der User-Daten aus einem Chat.
   */
  private async resolveUserData(chat: any): Promise<any> {
    // Falls bereits ein 'receiver'-Objekt vorhanden ist.
    if (chat.receiver) {
      return { ...chat, user: chat.receiver };
    }

    // Falls wir eine recipientUid haben, versuchen wir den User aus 'users' zu holen.
    if (chat.recipientUid) {
      try {
        // getUser() gibt ein Observable zurück; per toPromise() einmalig auslesen
        const userData = await this.getUser(chat.recipientUid).toPromise();
        return { ...chat, user: userData || this.getFallbackUserData() };
      } catch (error) {
        console.error('Error retrieving user data for chat:', error);
        return { ...chat, user: this.getFallbackUserData() };
      }
    }

    // Fallback, falls nichts davon greift.
    return { ...chat, user: this.getFallbackUserData() };
  }

  private getFallbackUserData(): any {
    return {
      name: 'Unknown User',
      photoURL: 'assets/img/profile-img/profile-img-placeholder.svg',
    };
  }

  getUser(uid: string): Observable<User> {
    return this.getDoc<User>('users', uid);
  }

  getChannel(channelId: string): Observable<Channel> {
    return this.getDoc<Channel>('channels', channelId);
  }

  getChat(id: string): Observable<any> {
    return this.getDoc('chats', id);
  }

  /**
   * Gibt eine generierte ID zurück, ohne etwas in Firestore zu speichern.
   */
  getUniqueId() {
    const id = doc(collection(this.firestore, 'dummyCollection')).id;
    return id;
  }

  getUserByUid(uid: string): Observable<User> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef, { idField: 'uid' }) as Observable<User>;
  }

  /**
   * Prüft einmalig, ob ein Dokument existiert.
   */
  async checkDocExists(
    collectionName: string,
    docId: string
  ): Promise<boolean> {
    const docRef = this.getDocRef(collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  /**
   * Primitive Email-Check-Funktion.
   */
  isEmail(qText: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*$/;
    return emailPattern.test(qText);
  }
}
