import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'firebaseDate',
  standalone: true,
})
export class FirebaseDatePipe implements PipeTransform {
  transform(value: Date | Timestamp | null): string {
    if (!value) return '';
    const date = value instanceof Timestamp ? value.toDate() : value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    if (inputDate.getTime() === today.getTime()) {
      return 'Heute';
    }
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    };
    return date.toLocaleDateString('de-DE', options);
  }
}
