import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import { FirebaseDatePipe } from 'src/app/shared/pipes/firebase-date.pipe';
import { Message } from 'src/app/core/shared/models/message.class';
import { MessageComponent } from '../message/message.component';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FirebaseDatePipe, MessageComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  @Input() messages: Message[] = [];
  messageToScrollTo?: string; // hier landet die messageId
  @Output() messageToEdit: EventEmitter<Message> = new EventEmitter();
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private lastMessageLength: number = 0;
  constructor(
    private firebaseService: FirebaseServicesService,
    private route: ActivatedRoute
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.route.queryParamMap.subscribe((params) => {
      this.messageToScrollTo = params.get('messageId') || undefined;
    });
    this.scrollToMessageIfNeeded();
    if (changes['messages']) {
      this.checkForNewMessages();
    }
  }

  scrollToMessageIfNeeded() {
    if (!this.messageToScrollTo) return;
    setTimeout(() => {
      const elem = document.getElementById('message-' + this.messageToScrollTo);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }

  private checkForNewMessages(): void {
    if (this.lastMessageLength !== this.messages.length) {
      this.scrollToBottom();
      this.lastMessageLength = this.messages.length;
    }
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      console.log('Scrolling to bottom');

      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    }
  }

  getTimestamp(time: Timestamp | Date | number): number | undefined {
    if (time instanceof Timestamp) {
      time = time.toDate();
    } else if (typeof time === 'number') {
      time = new Date(time);
    }
    return time instanceof Date ? time.getTime() : undefined;
  }

  isNewDay(prevTimestamp?: number, currentTimestamp?: number): boolean {
    if (!prevTimestamp || !currentTimestamp) return false;
    const prevDate = new Date(prevTimestamp);
    const currentDate = new Date(currentTimestamp);
    return !this.isSameDay(prevDate, currentDate);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  setEditMessage($event: Message) {
    this.messageToEdit.emit($event);
  }
}
