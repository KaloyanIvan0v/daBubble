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
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { where, query } from 'firebase/firestore';
import { AuthService } from '../auth-services/auth.service';
import { Channel } from 'src/app/core/shared/models/channel.class';

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
}
