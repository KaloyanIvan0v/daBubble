import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';
import { User } from 'src/app/core/shared/models/user.class';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { MessageComponent } from 'src/app/core/shared/components/message/message.component';
import { Timestamp } from '@angular/fire/firestore';
import { FirebaseDatePipe } from 'src/app/shared/pipes/firebase-date.pipe';

@Component({
  selector: 'app-direct-chat',
  templateUrl: './direct-chat.component.html',
  styleUrls: ['./direct-chat.component.scss'],
  standalone: true,
  imports: [
    InputBoxComponent,
    CommonModule,
    MessageComponent,
    FirebaseDatePipe,
  ],
})
export class DirectChatComponent implements OnInit, OnDestroy {
  chatId: string = '';
  currentUserUid: string = '';
  receiverId: string | null | undefined = null;
  receiverName$: Observable<string> = of('Name Placeholder');
  receiverPhotoURL$: Observable<string> = of(
    '/assets/img/profile-img/profile-img-placeholder.svg'
  );

  messages$!: Observable<Message[]>;
  messages: Message[] = [];
  messageToEdit: Message | undefined = undefined;
  private lastMessageLength: number = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseServicesService,
    private authService: AuthService,
    private workspaceService: WorkspaceService
  ) {}

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeComponent(): void {
    this.authService.getCurrentUserUID().then((uid) => {
      this.currentUserUid = uid ?? '';
      this.route.params.subscribe((params) => {
        this.chatId = params['chatId'];
        this.initializeReceiverData();
        this.subscribeToMessages(this.chatId);
      });
    });
  }

  private initializeReceiverData(): void {
    const chatData$ = this.route.params.pipe(
      switchMap((params) => this.getChatData(params['chatId']))
    );

    const receiverData$ = chatData$.pipe(
      switchMap((chatData) => this.getReceiverData(chatData))
    );

    this.subscriptions.add(
      receiverData$.subscribe((user) => {
        if (user) {
          this.receiverName$ = of(user.name);
          this.receiverPhotoURL$ = of(user.photoURL);
        }
      })
    );
  }

  private getChatData(chatId: string): Observable<DirectMessage | null> {
    this.chatId = chatId;
    return this.firebaseService.getDoc<DirectMessage>('directMessages', chatId);
  }

  private getReceiverData(
    chatData: DirectMessage | null
  ): Observable<User | null> {
    if (chatData && chatData.uid) {
      this.receiverId = chatData.uid.find((uid) => uid !== this.currentUserUid);
      if (this.receiverId) {
        return this.firebaseService
          .getUser(this.receiverId)
          .pipe(map((user) => user || this.getDefaultUser()));
      } else {
        console.error('Receiver ID not found in chat data.');
      }
    } else {
      console.error('Chat data not found or malformed.');
    }
    return of(this.getDefaultUser());
  }

  private getDefaultUser(): User {
    return {
      name: 'Unknown User',
      photoURL: '/assets/img/profile-img/profile-img-placeholder.svg',
    } as User;
  }

  openProfileView(uid: string) {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  private subscribeToMessages(chatId: string): void {
    this.messages$ = this.firebaseService.getMessages('directMessages', chatId);
    this.subscriptions.add(
      this.messages$.subscribe((messages) => this.handleMessages(messages))
    );
  }

  private handleMessages(messages: Message[]): void {
    if (messages) {
      this.messages = messages;
      setTimeout(() => {
        // Ensure messages are rendered before scrolling
        this.checkForNewMessages();
      });
    }
  }

  private checkForNewMessages(): void {
    if (this.lastMessageLength !== this.messages.length) {
      this.scrollToBottom();
      this.lastMessageLength = this.messages.length;
    }
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    }
  }

  get messagePath(): string {
    return `/directMessages/${this.chatId}/messages`;
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

  getTimestamp(time: Timestamp | Date | number): number | undefined {
    if (time instanceof Timestamp) {
      time = time.toDate();
    } else if (typeof time === 'number') {
      time = new Date(time);
    }
    return time instanceof Date ? time.getTime() : undefined;
  }
}
