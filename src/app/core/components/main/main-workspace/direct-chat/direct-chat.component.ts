import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, from, Subject } from 'rxjs';
import { switchMap, map, takeUntil, catchError } from 'rxjs/operators';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { DirectMessage } from 'src/app/core/shared/models/direct-message.class';
import { User } from 'src/app/core/shared/models/user.class';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { MessageComponent } from 'src/app/core/shared/components/message/message.component';
import { FirebaseDatePipe } from 'src/app/shared/pipes/firebase-date.pipe';
import { ChatComponent } from 'src/app/core/shared/components/chat/chat.component';

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
    ChatComponent,
  ],
})
export class DirectChatComponent implements OnInit, OnDestroy {
  chatId: string = '';
  currentUserUid: string = '';
  receiverId: string | null = null;
  receiverName$: Observable<string> = of('Name Placeholder');
  receiverPhotoURL$: Observable<string> = of(
    '/assets/img/profile-img/profile-img-placeholder.svg'
  );
  messages$: Observable<Message[]> = of([]);
  messageToEdit: Message | undefined = undefined;
  usersUid: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseServicesService,
    private authService: AuthService,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  messageToEditHandler(message: Message): void {
    this.messageToEdit = message;
  }

  setUsersUid(uid: string): void {
    this.usersUid = [uid];
  }

  private initializeComponent(): void {
    this.getCurrentUserUidAndParams$()
      .pipe(
        switchMap(() => this.getMessagesForChat$()),
        takeUntil(this.destroy$)
      )
      .subscribe((messages) => (this.messages$ = of(messages)));
  }

  private getCurrentUserUidAndParams$(): Observable<void> {
    return from(this.authService.getCurrentUserUID()).pipe(
      switchMap((uid) => {
        this.currentUserUid = uid ?? '';
        return this.route.params;
      }),
      map((params) => {
        this.chatId = params['chatId'];
        this.initializeReceiverData();
      })
    );
  }

  private getMessagesForChat$(): Observable<Message[]> {
    return this.firebaseService.getMessages('directMessages', this.chatId).pipe(
      catchError((error) => {
        console.error('Error fetching messages:', error);
        return of([]);
      })
    );
  }

  private initializeReceiverData(): void {
    const chatData$ = this.getChatDataStream();
    const receiverData$ = this.getReceiverDataStream(chatData$);
    this.setReceiverNameStream(receiverData$);
    this.setReceiverPhotoStream(receiverData$);
    this.subscribeToReceiverData(receiverData$);
  }

  private getChatDataStream(): Observable<DirectMessage | null> {
    return this.route.params.pipe(
      switchMap((params) => this.getChatData(params['chatId']))
    );
  }

  private getReceiverDataStream(
    chatData$: Observable<DirectMessage | null>
  ): Observable<User> {
    return chatData$.pipe(
      switchMap((chatData) => this.getReceiverData(chatData))
    );
  }

  private setReceiverNameStream(receiverData$: Observable<User>): void {
    this.receiverName$ = receiverData$.pipe(
      map((u) => u?.name || 'Unknown User'),
      catchError(() => of('Unknown User'))
    );
  }

  private setReceiverPhotoStream(receiverData$: Observable<User>): void {
    this.receiverPhotoURL$ = receiverData$.pipe(
      map(
        (u) =>
          u?.photoURL || '/assets/img/profile-img/profile-img-placeholder.svg'
      ),
      catchError(() =>
        of('/assets/img/profile-img/profile-img-placeholder.svg')
      )
    );
  }

  private subscribeToReceiverData(receiverData$: Observable<User>): void {
    receiverData$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        if (user) this.setUsersUid(user.uid);
      },
      error: (err) => console.error('Error fetching receiver data:', err),
    });
  }

  private getChatData(chatId: string): Observable<DirectMessage | null> {
    this.chatId = chatId;
    return this.firebaseService
      .getDoc<DirectMessage>('directMessages', chatId)
      .pipe(
        catchError((error) => {
          console.error('Error fetching chat data:', error);
          return of(null);
        })
      );
  }

  private getReceiverData(chatData: DirectMessage | null): Observable<User> {
    const receiverId = this.extractReceiverIdFromChatData(chatData);
    if (!receiverId) return of(this.getDefaultUser());
    this.setUsersUid(receiverId);
    return this.getReceiverDataFromFirebase$(receiverId);
  }

  private extractReceiverIdFromChatData(
    chatData: DirectMessage | null
  ): string | null {
    if (chatData?.uid && Array.isArray(chatData.uid)) {
      return chatData.uid.find((uid) => uid !== this.currentUserUid) || null;
    }
    return null;
  }

  private getReceiverDataFromFirebase$(receiverId: string): Observable<User> {
    this.receiverId = receiverId;
    return this.firebaseService.getUser(receiverId).pipe(
      map((user) => user || this.getDefaultUser()),
      catchError((error) => {
        console.error('Error:', error);
        return of(this.getDefaultUser());
      })
    );
  }

  private getDefaultUser(): User {
    return {
      name: 'Unknown User',
      photoURL: '/assets/img/profile-img/profile-img-placeholder.svg',
    } as User;
  }

  openProfileView(uid: string): void {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  get messagePath(): string {
    return `/directMessages/${this.chatId}/messages`;
  }
}
