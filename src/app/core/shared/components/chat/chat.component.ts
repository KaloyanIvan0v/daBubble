import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
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
  styleUrls: ['./chat.component.scss'],
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

  /**
   * Lifecycle hook that initializes the component.
   * Subscribes to query parameters to handle message scrolling.
   */
  ngOnInit(): void {
    this.firstScrollDone = false;
    this.subscribeToQueryParams();
  }

  /**
   * Subscribes to the route's query parameters and handles scrolling logic.
   */
  private subscribeToQueryParams(): void {
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      this.handleQueryParams(params);
    });
  }

  /**
   * Handles the query parameters to determine which message to scroll to.
   * @param params - The current route's query parameters
   */
  private handleQueryParams(params: ParamMap): void {
    this.messageToScrollTo = params.get('messageId') || null;
    if (this.messageToScrollTo) {
      this.scrollToMessageIfNeeded(true);
      this.firstScrollDone = true;
    } else {
      this.handleNoMessageId();
    }
  }

  /**
   * Handles the scenario when no specific message ID is provided in the query parameters.
   */
  private handleNoMessageId(): void {
    if (!this.messages.length) return;
    this.setMessageToLastMessageToScroll();
    this.scrollToMessageIfNeeded(false);
  }

  /**
   * Lifecycle hook that detects changes to input properties.
   * Checks for new messages and scrolls if necessary.
   * @param changes - An object of current and previous property values
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.scheduleCheckForNewMessages();
    }
  }

  /**
   * Schedules a check for new messages after a short delay.
   */
  private scheduleCheckForNewMessages(): void {
    setTimeout(() => {
      this.checkForNewMessages();
    }, 200);
  }

  /**
   * Scrolls to a specific message if needed.
   * @param useSmooth - Determines if the scrolling should be smooth
   */
  scrollToMessageIfNeeded(useSmooth: boolean = true): void {
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

  /**
   * Checks for new messages and scrolls to the bottom if new messages are detected.
   */
  private checkForNewMessages(): void {
    if (this.hasNewMessages()) {
      this.scrollToBottom(true);
      this.updateLastMessageLength();
    }
  }

  /**
   * Determines if there are new messages compared to the last known count.
   * @returns True if new messages are present, otherwise false
   */
  private hasNewMessages(): boolean {
    return this.lastMessageLength !== this.messages.length;
  }

  /**
   * Updates the last message length to the current messages array length.
   */
  private updateLastMessageLength(): void {
    this.lastMessageLength = this.messages.length;
  }

  /**
   * Sets the `messageToScrollTo` property to the ID of the last message in the list.
   */
  private setMessageToLastMessageToScroll(): void {
    this.messageToScrollTo = this.getLastMessageId();
  }

  /**
   * Retrieves the ID of the last message in the messages array.
   * @returns The ID of the last message
   */
  private getLastMessageId(): string {
    return this.messages[this.messages.length - 1].id;
  }

  /**
   * Converts a Timestamp, Date, or number to a UNIX timestamp in milliseconds.
   * @param time - The time value to convert
   * @returns The UNIX timestamp in milliseconds or undefined if invalid
   */
  getTimestamp(time: Timestamp | Date | number): number | undefined {
    const date = this.convertToDate(time);
    return date ? date.getTime() : undefined;
  }

  /**
   * Converts various time formats to a Date object.
   * @param time - The time value to convert
   * @returns A Date object or undefined if conversion fails
   */
  private convertToDate(time: Timestamp | Date | number): Date | undefined {
    if (time instanceof Timestamp) {
      return time.toDate();
    } else if (typeof time === 'number') {
      return new Date(time);
    } else if (time instanceof Date) {
      return time;
    }
    return undefined;
  }

  /**
   * Determines if the current message is on a new day compared to the previous message.
   * @param prevTimestamp - The timestamp of the previous message
   * @param currentTimestamp - The timestamp of the current message
   * @returns True if it's a new day, otherwise false
   */
  isNewDay(prevTimestamp?: number, currentTimestamp?: number): boolean {
    if (!prevTimestamp || !currentTimestamp) return false;
    return !this.isSameDay(new Date(prevTimestamp), new Date(currentTimestamp));
  }

  /**
   * Checks if two dates fall on the same calendar day.
   * @param date1 - The first date to compare
   * @param date2 - The second date to compare
   * @returns True if both dates are on the same day, otherwise false
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Emits an event to notify parent components that a message is to be edited.
   * @param message - The message object to edit
   */
  setEditMessage(message: Message): void {
    this.messageToEdit.emit(message);
  }

  /**
   * Scrolls the message container to the bottom.
   * @param smooth - Determines if the scrolling should be smooth
   */
  private scrollToBottom(smooth: boolean = true): void {
    if (!this.messageContainer) return;
    const container = this.messageContainer.nativeElement as HTMLElement;
    container.scroll({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }
}
