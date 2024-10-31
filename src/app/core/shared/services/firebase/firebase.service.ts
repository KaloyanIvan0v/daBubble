import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Firestore,
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  CollectionReference,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { where, query } from 'firebase/firestore';
import { AuthService } from '../auth-services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServicesService implements OnDestroy {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private dataSubjects: Map<string, BehaviorSubject<any>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  userUID!: string | null;

  constructor() {
    this.authService.getCurrentUserUID().then((uid) => {
      this.userUID = uid;
    });
  }

  ngOnDestroy(): void {
    this.dataSubjects.forEach((subject) => subject.complete());
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.dataSubjects.clear();
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

  private handleSnapshot<T>(
    snapshot: any,
    observer: any,
    extractData: (doc: any) => T
  ) {
    const data = snapshot.docs
      ? snapshot.docs.map(extractData)
      : snapshot.exists()
      ? extractData(snapshot)
      : null;

    if (data) observer.next(data);
    else observer.error('Document does not exist');
  }

  getCollection<T>(
    collectionName: string,
    uidAccess: boolean
  ): Observable<T[]> {
    const refCollection = this.getCollectionRef(collectionName);
    const userSpecificQuery = query(
      refCollection,
      where('uid', 'array-contains', this.userUID)
    );
    console.log('uid', this.userUID);

    return new Observable((observer) =>
      onSnapshot(
        uidAccess ? userSpecificQuery : refCollection,
        (snapshot) =>
          this.handleSnapshot(snapshot, observer, this.mapDocumentData),
        (error) =>
          observer.error(
            `Error fetching collection ${collectionName}: ${error}`
          )
      )
    );
  }

  getDoc<T>(collectionName: string, docId: string): Observable<T> {
    const docRef = this.getDocRef(collectionName, docId);
    return new Observable((observer) =>
      onSnapshot(
        docRef,
        (snapshot) =>
          this.handleSnapshot(snapshot, observer, this.mapDocumentData),
        (error) => observer.error(`Error fetching document ${docId}: ${error}`)
      )
    );
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

  getChannel(id: string): Observable<any> {
    return this.getDoc('channels', id);
  }

  getChat(id: string): Observable<any> {
    return this.getDoc('chats', id);
  }
}
