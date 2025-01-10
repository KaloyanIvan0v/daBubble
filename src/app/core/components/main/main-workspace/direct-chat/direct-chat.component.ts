import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
    'assets/img/profile-img/profile-img-placeholder.svg'
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

  /** Initializes component logic. */
  ngOnInit(): void {
    this.initializeComponent();
  }

  /** Cleans up subscriptions. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sets a message to be edited.
   * @param message The message to edit.
   */
  messageToEditHandler(message: Message): void {
    this.messageToEdit = message;
  }

  /**
   * Stores the given user UID in a local array.
   * @param uid The user's UID.
   */
  setUsersUid(uid: string): void {
    this.usersUid = [uid];
  }

  /** Fetches current user UID, route params, and initializes messages. */
  private initializeComponent(): void {
    this.getCurrentUserUidAndParams$()
      .pipe(
        switchMap(() => this.getMessagesForChat$()),
        takeUntil(this.destroy$)
      )
      .subscribe((messages) => (this.messages$ = of(messages)));
  }

  /** Returns an observable that fetches current user UID and reads route params. */
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

  /** Returns an observable that retrieves messages for the current chat. */
  private getMessagesForChat$(): Observable<Message[]> {
    return this.firebaseService.getMessages('directMessages', this.chatId).pipe(
      catchError((error) => {
        console.error('Error fetching messages:', error);
        return of([]);
      })
    );
  }

  /** Prepares receiver data: name, photo, and user details. */
  private initializeReceiverData(): void {
    const chatData$ = this.getChatDataStream();
    const receiverData$ = this.getReceiverDataStream(chatData$);
    this.setReceiverNameStream(receiverData$);
    this.setReceiverPhotoStream(receiverData$);
    this.subscribeToReceiverData(receiverData$);
  }

  /** Fetches chat data from route params. */
  private getChatDataStream(): Observable<DirectMessage | null> {
    return this.route.params.pipe(
      switchMap((params) => this.getChatData(params['chatId']))
    );
  }

  /**
   * Extracts receiver data from chat information.
   * @param chatData$ Observable of the DirectMessage object.
   */
  private getReceiverDataStream(
    chatData$: Observable<DirectMessage | null>
  ): Observable<User> {
    return chatData$.pipe(
      switchMap((chatData) => this.getReceiverData(chatData))
    );
  }

  /**
   * Maps the receiver's name from the user data stream.
   * @param receiverData$ Observable of user data.
   */
  private setReceiverNameStream(receiverData$: Observable<User>): void {
    this.receiverName$ = receiverData$.pipe(
      map((u) => u?.name || 'Unknown User'),
      catchError(() => of('Unknown User'))
    );
  }

  /**
   * Maps the receiver's photo URL from the user data stream.
   * @param receiverData$ Observable of user data.
   */
  private setReceiverPhotoStream(receiverData$: Observable<User>): void {
    this.receiverPhotoURL$ = receiverData$.pipe(
      map(
        (u) =>
          u?.photoURL || 'assets/img/profile-img/profile-img-placeholder.svg'
      ),
      catchError(() => of('assets/img/profile-img/profile-img-placeholder.svg'))
    );
  }

  /**
   * Subscribes to receiver data and extracts user UID.
   * @param receiverData$ Observable of user data.
   */
  private subscribeToReceiverData(receiverData$: Observable<User>): void {
    receiverData$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        if (user) this.setUsersUid(user.uid);
      },
      error: (err) => console.error('Error fetching receiver data:', err),
    });
  }

  /**
   * Fetches a specific chat document from the 'directMessages' collection.
   * @param chatId The ID of the chat to retrieve.
   */
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

  /**
   * Determines the receiver's UID from the chat data.
   * @param chatData The current chat data.
   */
  private getReceiverData(chatData: DirectMessage | null): Observable<User> {
    const receiverId = this.extractReceiverIdFromChatData(chatData);
    if (!receiverId) return of(this.getDefaultUser());
    this.setUsersUid(receiverId);
    return this.getReceiverDataFromFirebase$(receiverId);
  }

  /**
   * Finds which UID in the chat data belongs to the receiver.
   * @param chatData The chat data containing both user UIDs.
   */
  private extractReceiverIdFromChatData(
    chatData: DirectMessage | null
  ): string | null {
    if (!chatData?.uid || !Array.isArray(chatData.uid)) {
      return null;
    }
    const receiverId = chatData.uid.find((uid) => uid !== this.currentUserUid);
    return receiverId ?? this.currentUserUid;
  }

  /**
   * Retrieves the receiver's user data from Firebase.
   * @param receiverId The UID of the receiver.
   */
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

  /** Returns a default user object. */
  private getDefaultUser(): User {
    return {
      name: 'Unknown User',
      photoURL: 'assets/img/profile-img/profile-img-placeholder.svg',
    } as User;
  }

  /**
   * Opens the user profile pop-up.
   * @param uid The UID of the user whose profile is viewed.
   */
  openProfileView(uid: string): void {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  /** Returns the Firestore path for messages of the current chat. */
  get messagePath(): string {
    return `/directMessages/${this.chatId}/messages`;
  }
}
