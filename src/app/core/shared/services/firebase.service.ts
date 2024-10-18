import { Injectable, OnDestroy, inject } from '@angular/core';
import {
  Firestore,
  collection,
  onSnapshot,
  doc,
} from '@angular/fire/firestore';

import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseServicesService implements OnDestroy {
  firestore: Firestore = inject(Firestore);

  private dataSubjects: Map<string, BehaviorSubject<any>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  ngOnDestroy(): void {
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeFunctions.clear();
    this.dataSubjects.clear();
  }

  getRealtimeCollectionData(collectionName: string): Observable<any> {
    if (this.dataSubjects.has(collectionName)) {
      return this.dataSubjects.get(collectionName)!.asObservable();
    }
    const refCollection = collection(this.firestore, collectionName);
    const dataSubject = new BehaviorSubject<any>([]);
    this.dataSubjects.set(collectionName, dataSubject);
    const unsubscribe = onSnapshot(refCollection, (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dataSubject.next(updatedData);
    });
    this.unsubscribeFunctions.set(collectionName, unsubscribe);
    return dataSubject.asObservable();
  }

  getDoc(collectionName: string, docId: string): Observable<any> {
    const docRef = doc(this.firestore, collectionName, docId);
    return new Observable((observer) => {
      onSnapshot(
        docRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            observer.next(docSnapshot.data());
          } else {
            observer.error(new Error('Document does not exist'));
          }
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }
}
