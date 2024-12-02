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
import { BehaviorSubject, Observable, Observer, switchMap } from 'rxjs';
import { where, getDoc } from 'firebase/firestore';
import { AuthService } from '../auth-services/auth.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from '../../models/user.class';
import { QuerySnapshot, DocumentData } from '@angular/fire/firestore';

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

  getMessages(collectionName: string, docId: string): Observable<Message[]> {
    const messagesCollectionRef = collection(
      this.firestore,
      `${collectionName}/${docId}/messages`
    );
    const q = query(messagesCollectionRef, orderBy('time'));
    return this.createObservableFromQuery<Message[]>(
      q,
      'Error fetching messages'
    );
  }

  getThreadMessages(threadPath: string): Observable<Message[]> {
    const threadMessagesCollectionRef = collection(this.firestore, threadPath);
    const q = query(threadMessagesCollectionRef, orderBy('time'));
    return this.createObservableFromQuery<Message[]>(
      q,
      'Error fetching thread messages'
    );
  }

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

  getCollection<T>(
    collectionName: string,
    uidAccess: boolean
  ): Observable<T[]> {
    const refCollection = this.getCollectionRef(collectionName);
    return this.userUIDSubject.pipe(
      switchMap((uid) => {
        const userSpecificQuery = this.createUserSpecificQuery(
          refCollection,
          uidAccess,
          uid
        );
        return this.createCollectionObservable<T>(
          userSpecificQuery,
          collectionName
        );
      })
    );
  }

  private createUserSpecificQuery(
    refCollection: CollectionReference,
    uidAccess: boolean,
    uid: string | null
  ) {
    return uidAccess && uid
      ? query(refCollection, where('uid', 'array-contains', uid))
      : refCollection;
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

  private async processChatSnapshots(
    snapshot: QuerySnapshot<DocumentData>
  ): Promise<any[]> {
    const chatPromises = snapshot.docs.map((doc: any) => {
      const chat = this.mapDocumentData<any>(doc);
      return this.resolveUserData(chat);
    });
    return Promise.all(chatPromises);
  }

  async addUserToChat(chat: any): Promise<any> {
    return this.resolveUserData(chat);
  }

  private async resolveUserData(chat: any): Promise<any> {
    if (chat.receiver) return this.useReceiverData(chat);
    if (chat.recipientUid) return await this.fetchUserData(chat);
    return this.useFallbackUserData(chat);
  }

  private useReceiverData(chat: any): any {
    return { ...chat, user: chat.receiver };
  }

  private async fetchUserData(chat: any): Promise<any> {
    try {
      const userData = await this.getUser(chat.recipientUid).toPromise();
      return { ...chat, user: userData || this.getFallbackUserData() };
    } catch (error) {
      console.error('Error retrieving user data for chat:', error);
      return this.useFallbackUserData(chat);
    }
  }

  private useFallbackUserData(chat: any): any {
    return { ...chat, user: this.getFallbackUserData() };
  }

  private getFallbackUserData(): any {
    return {
      name: 'Unknown User',
      photoURL: 'assets/img/profile-img/profile-img-placeholder.svg',
    };
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

  getUserByUid(uid: string): Observable<User> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef, { idField: 'uid' }) as Observable<User>;
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

  async checkDocExists(
    collectionName: string,
    docId: string
  ): Promise<boolean> {
    const docRef = this.getDocRef(collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  searchUsers(queryText: string): Observable<any[]> {
    const usersRef = collection(this.firestore, 'users');
    const lowerCaseQuery = queryText.trim().toLowerCase();
    if (queryText.startsWith('@')) {
      const username = queryText.slice(1).toLowerCase();
      return this.searchByUsername(usersRef, username);
    } else if (this.isEmail(queryText)) {
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
    const channelName = queryText.trim().slice(1);
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(
      channelsRef,
      where('name', '>=', channelName),
      where('name', '<=', channelName + '\uf8ff')
    );
    return this.getDocs(q);
  }

  search(queryText: string): Observable<any[]> {
    if (queryText.startsWith('@')) {
      return this.searchUsers(queryText);
    } else if (queryText.startsWith('#')) {
      return this.searchChannels(queryText);
    } else {
      return this.searchUsers(queryText);
    }
  }
}
