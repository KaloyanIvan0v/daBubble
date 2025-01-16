import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Firestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  setDoc,
  collectionGroup,
  docData,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { where, getDoc } from 'firebase/firestore';
import { AuthService } from '../auth-services/auth.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from '../../models/user.class';
import { Chat } from '../../models/chat.class';

@Injectable({ providedIn: 'root' })
export class FirebaseServicesService implements OnDestroy {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private dataSubjects = new Map<string, BehaviorSubject<any>>();
  private unsubscribeFunctions = new Map<string, () => void>();
  private userUID$ = new BehaviorSubject<string | null>(null);

  constructor() {
    this.authService.getCurrentUserUID().then((uid) => this.userUID$.next(uid));
  }

  /**
   * Cleans up subscriptions and completes all subjects.
   */
  ngOnDestroy(): void {
    this.dataSubjects.forEach((subject) => subject.complete());
    this.unsubscribeFunctions.forEach((unsub) => unsub());
    this.dataSubjects.clear();
    this.unsubscribeFunctions.clear();
  }

  /**
   * Clears all data subjects by setting their value to null.
   */
  clearDataSubjects(): void {
    this.dataSubjects.forEach((subject) => subject.next(null));
    this.dataSubjects.clear();
  }

  /**
   * Sets the current user UID.
   * @param uid User UID or null.
   */
  setUserUID(uid: string | null): void {
    this.userUID$.next(uid);
  }

  /**
   * Retrieves a collection reference.
   * @param name Collection name.
   * @returns CollectionReference<DocumentData>
   */
  private getCollectionRef(name: string): CollectionReference<DocumentData> {
    return collection(this.firestore, name);
  }

  /**
   * Gets a document reference.
   * @param collectionName Collection name.
   * @param docId Document ID.
   * @returns DocumentReference
   */
  getDocRef(collectionName: string, docId: string) {
    return doc(this.firestore, collectionName, docId);
  }

  /**
   * Maps a Firestore document to a typed object with ID.
   * @param doc Firestore document.
   * @returns Mapped object with ID.
   */
  private mapDoc<T>(doc: any): T & { id: string } {
    return { ...(doc.data() as T), id: doc.id };
  }

  /**
   * Creates an observable from a Firestore query.
   * @param q Firestore query.
   * @param errorMsg Error message on failure.
   * @returns Observable of array of T.
   */
  private createObservable<T>(q: any, errorMsg: string): Observable<T[]> {
    return new Observable((observer) =>
      onSnapshot(
        q,
        (snapshot: QuerySnapshot) =>
          observer.next(snapshot.docs.map((doc) => this.mapDoc<T>(doc))),
        (error) => observer.error(`${errorMsg}: ${error}`)
      )
    );
  }

  /**
   * Retrieves all messages using a collection group query.
   * @returns Observable of Message array.
   */
  getAllMessages(): Observable<Message[]> {
    return this.createObservable<Message>(
      collectionGroup(this.firestore, 'messages'),
      'Error fetching messages'
    );
  }

  /**
   * Retrieves ordered messages from a specified path.
   * @param path Firestore path.
   * @returns Observable of Message array.
   */
  private getOrderedMessages(path: string): Observable<Message[]> {
    const q = query(collection(this.firestore, path), orderBy('time'));
    return this.createObservable<Message>(q, 'Error fetching ordered messages');
  }

  /**
   * Gets messages from a specific collection and document.
   * @param collection Collection name.
   * @param docId Document ID.
   * @returns Observable of Message array.
   */
  getMessages(collection: string, docId: string): Observable<Message[]> {
    return this.getOrderedMessages(`${collection}/${docId}/messages`);
  }

  getThreadMessages(threadPath: string): Observable<Message[]> {
    return this.getOrderedMessages(threadPath);
  }

  /**
   * Sends a message by setting a document at the specified path.
   * @param path Firestore path.
   * @param message Message object.
   */
  async sendMessage(path: string, message: Message): Promise<void> {
    await setDoc(doc(this.firestore, path), message);
  }

  /**
   * Sends a thread message within a specific message thread.
   * @param collection Collection name.
   * @param docId Document ID.
   * @param messageId Message ID.
   * @param threadMsg Thread message object.
   */
  async sendThreadMessage(
    collection: string,
    docId: string,
    messageId: string,
    threadMsg: Message
  ): Promise<void> {
    const path = `${collection}/${docId}/messages/${messageId}/thread/messages/${threadMsg.id}`;
    await setDoc(doc(this.firestore, path), threadMsg);
  }

  /**
   * Updates a message with partial data.
   * @param path Firestore path.
   * @param data Partial message data.
   */
  async updateMessage(path: string, data: Partial<Message>): Promise<void> {
    await updateDoc(doc(this.firestore, path), data);
  }

  /**
   * Deletes a message from a specific collection and document.
   * @param collection Collection name.
   * @param docId Document ID.
   * @param messageId Message ID.
   */
  async deleteMessage(
    collection: string,
    docId: string,
    messageId: string
  ): Promise<void> {
    await deleteDoc(
      doc(this.firestore, `${collection}/${docId}/messages/${messageId}`)
    );
  }

  /**
   * Retrieves a collection with optional UID-based access.
   * @param name Collection name.
   * @param uidAccess Whether to filter by UID.
   * @returns Observable of array of T.
   */
  getCollection<T>(name: string, uidAccess: boolean): Observable<T[]> {
    return this.userUID$.pipe(
      switchMap((uid) => {
        const q =
          uidAccess && uid
            ? query(
                this.getCollectionRef(name),
                where('uid', 'array-contains', uid)
              )
            : this.getCollectionRef(name);
        return this.createObservable<T>(q, `Error fetching collection ${name}`);
      })
    );
  }

  /**
   * Retrieves a single document as an observable.
   * @param collection Collection name.
   * @param docId Document ID.
   * @returns Observable of T.
   */
  getDoc<T>(collection: string, docId: string): Observable<T> {
    const key = `${collection}-${docId}`;
    if (!this.dataSubjects.has(key)) {
      const subject = new BehaviorSubject<T | null>(null);
      this.dataSubjects.set(key, subject);
      const unsubscribe = onSnapshot(
        this.getDocRef(collection, docId),
        (docSnap) =>
          subject.next(docSnap.exists() ? this.mapDoc<T>(docSnap) : null),
        (error) => subject.error(`Error fetching ${docId}: ${error}`)
      );
      this.unsubscribeFunctions.set(key, unsubscribe);
    }
    return this.dataSubjects.get(key)!.asObservable();
  }

  /**
   * Retrieves a document once without subscribing.
   * @param collection Collection name.
   * @param docId Document ID.
   * @returns Promise resolving to document data or undefined.
   */
  async getDocOnce(collection: string, docId: string): Promise<any> {
    try {
      const snap = await getDoc(this.getDocRef(collection, docId));
      return snap.exists() ? snap.data() : undefined;
    } catch (error) {
      console.error('GetDocOnce error:', error);
      return undefined;
    }
  }

  /**
   * Adds a new document to a collection.
   * @param collection Collection name.
   * @param data Data to add.
   * @returns Promise resolving to new document ID.
   */
  async addDoc<T extends Record<string, any>>(
    collection: string,
    data: T
  ): Promise<string> {
    return (await addDoc(this.getCollectionRef(collection), data)).id;
  }

  async createDocWithCustomId<T extends Record<string, any>>(
    collection: string,
    docId: string,
    data: T
  ): Promise<void> {
    const docRef = doc(this.getCollectionRef(collection), docId);
    await setDoc(docRef, data);
  }

  /**
   * Updates an existing document with partial data.
   * @param collection Collection name.
   * @param docId Document ID.
   * @param data Partial data to update.
   */
  async updateDoc<T>(
    collection: string,
    docId: string,
    data: Partial<T>
  ): Promise<void> {
    await updateDoc(this.getDocRef(collection, docId), data);
  }

  getUsers(): Observable<User[]> {
    return this.getCollection<User>('users', false);
  }

  /**
   * Updates a user's data.
   * @param uid User UID.
   * @param data Partial user data.
   */
  updateUser(uid: string, data: Partial<User>): void {
    updateDoc(this.getDocRef('users', uid), data);
  }

  getChannels(): Observable<Channel[]> {
    return this.getCollection<Channel>('channels', true);
  }

  getChats(): Observable<Chat[]> {
    return this.getCollection<Chat>('directMessages', true);
  }

  /**
   * Adds a user to a chat.
   * @param chat Chat object.
   * @returns Promise resolving to updated chat.
   */
  async addUserToChat(chat: any): Promise<any> {
    if (chat.receiver) return { ...chat, user: chat.receiver };
    if (chat.recipientUid) {
      try {
        const user = await this.getUser(chat.recipientUid).toPromise();
        return { ...chat, user: user || this.fallbackUser() };
      } catch {
        return { ...chat, user: this.fallbackUser() };
      }
    }
    return { ...chat, user: this.fallbackUser() };
  }

  /**
   * Provides a fallback user object.
   * @returns Fallback User.
   */
  private fallbackUser() {
    return {
      name: 'Unknown User',
      photoURL: 'assets/img/profile-img/profile-img-placeholder.svg',
    };
  }

  getUser(uid: string): Observable<User> {
    return this.getDoc<User>('users', uid);
  }

  /**
   * Retrieves a channel by ID.
   * @param channelId Channel ID.
   * @returns Observable of Channel.
   */
  getChannel(channelId: string): Observable<Channel> {
    return this.getDoc<Channel>('channels', channelId);
  }

  getChat(id: string): Observable<Chat> {
    return this.getDoc<Chat>('chats', id);
  }

  /**
   * Generates a unique ID.
   * @returns Unique string ID.
   */
  getUniqueId(): string {
    return doc(collection(this.firestore, 'dummyCollection')).id;
  }

  /**
   * Retrieves a user by UID with ID field.
   * @param uid User UID.
   * @returns Observable of User.
   */
  getUserByUid(uid: string): Observable<User> {
    return docData(this.getDocRef('users', uid), {
      idField: 'uid',
    }) as Observable<User>;
  }

  /**
   * Checks if a document exists.
   * @param collection Collection name.
   * @param docId Document ID.
   * @returns Promise resolving to boolean.
   */
  async checkDocExists(collection: string, docId: string): Promise<boolean> {
    try {
      const snap = await getDoc(this.getDocRef(collection, docId));
      return snap.exists();
    } catch {
      return false;
    }
  }

  /**
   * Validates if a string is an email.
   * @param text Input string.
   * @returns True if valid email, else false.
   */
  isEmail(text: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(text);
  }

  getAllChannels(): Observable<Channel[]> {
    return this.getCollection<Channel>('channels', false);
  }
}
