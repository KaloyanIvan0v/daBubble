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

@Injectable({
  providedIn: 'root',
})
export class FirebaseServicesService implements OnDestroy {
  private firestore: Firestore = inject(Firestore);

  private dataSubjects: Map<string, BehaviorSubject<any>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  ngOnDestroy(): void {
    // Ensure all BehaviorSubjects are completed to avoid memory leaks
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

  getCollection<T>(collectionName: string): Observable<T[]> {
    const refCollection = this.getCollectionRef(collectionName);
    return new Observable<T[]>((observer) => {
      const unsubscribe = onSnapshot(
        refCollection,
        (snapshot) => {
          const updatedData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          observer.next(updatedData);
        },
        (error) => {
          console.error(`Error fetching collection ${collectionName}:`, error);
          observer.error(error);
        }
      );
      return unsubscribe;
    });
  }

  getDoc<T>(collectionName: string, docId: string): Observable<T> {
    const docRef = this.getDocRef(collectionName, docId);
    return new Observable<T>((observer) => {
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const updatedData = {
              id: snapshot.id,
              ...snapshot.data(),
            } as T;
            observer.next(updatedData);
          } else {
            observer.error(
              `Document with ID ${docId} does not exist in collection ${collectionName}`
            );
          }
        },
        (error) => {
          console.error(
            `Error fetching document ${docId} in collection ${collectionName}:`,
            error
          );
          observer.error(error);
        }
      );
      return unsubscribe;
    });
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
}
