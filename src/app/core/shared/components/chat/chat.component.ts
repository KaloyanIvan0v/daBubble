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

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FirebaseDatePipe, MessageComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  @Input() messages: Message[] = [];
  @Input() showThread: boolean = true;
  messageToScrollTo: string | null = null;
  @Output() messageToEdit: EventEmitter<Message> = new EventEmitter();
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  firstScrollDone: boolean = false;

  private lastMessageLength: number = 0;
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.firstScrollDone = false;
    this.route.queryParamMap.subscribe((params) => {
      this.messageToScrollTo = params.get('messageId') || null;
      if (this.messageToScrollTo) {
        this.scrollToMessageIfNeeded(true);
        this.firstScrollDone = true;
      } else {
        if (!this.messages.length) return;
        this.setMessageToLastMessageToScroll();
        this.scrollToMessageIfNeeded(false);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages'] && this.firstScrollDone) {
      setTimeout(() => {
        this.checkForNewMessages();
      }, 200);
    }
  }

  scrollToMessageIfNeeded(useSmooth: boolean = true) {
    if (!this.messageToScrollTo) return;
    setTimeout(() => {
      const elem = document.getElementById('message-' + this.messageToScrollTo);
      if (elem) {
        elem.scrollIntoView({
          behavior: useSmooth ? 'smooth' : 'auto',
          block: 'center',
        });
      }
    }, 0);
  }

  private checkForNewMessages(): void {
    if (this.lastMessageLength !== this.messages.length) {
      setTimeout(() => {
        this.setMessageToLastMessageToScroll();
        this.scrollToMessageIfNeeded(true);
      }, 200);
      this.lastMessageLength = this.messages.length;
    }
  }

  setMessageToLastMessageToScroll(): void {
    this.messageToScrollTo = this.messages[this.messages.length - 1].id;
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
