import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'firebaseTime',
  standalone: true,
})
export class FirebaseTimePipe implements PipeTransform {
  transform(value: Date | Timestamp | null): string {
    if (!value) return '';
    const date = value instanceof Timestamp ? value.toDate() : value;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
