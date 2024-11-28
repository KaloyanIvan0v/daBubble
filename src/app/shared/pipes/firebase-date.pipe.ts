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

    // Get today's date
    const today = new Date();
    // Set the time part of the date to 00:00 to ignore time comparison
    today.setHours(0, 0, 0, 0);

    // Compare if the given date is today's date
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0); // Reset input time part to compare only the date

    if (inputDate.getTime() === today.getTime()) {
      return 'Heute'; // Return "Heute" if the date is today's date
    }

    // Format the date in "Dienstag, 14 Januar" format
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', // 'long' gives the full name of the weekday (e.g., "Dienstag")
      day: '2-digit', // '2-digit' for the day (e.g., "14")
      month: 'long', // 'long' gives the full name of the month (e.g., "Januar")
    };

    // Return the formatted date in German locale (de-DE)
    return date.toLocaleDateString('de-DE', options);
  }
}
