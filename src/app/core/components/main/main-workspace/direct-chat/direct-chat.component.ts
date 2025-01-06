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

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Sets the message to edit in the component
   * @param message Message to be edited
   */
  /******  1162038d-b0aa-4a1f-9c8f-946c715bc51a  *******/
  messageToEditHandler(message: Message): void {
    this.messageToEdit = message;
  }

  setUsersUid(uid: string): void {
    this.usersUid = [uid];
  }

  /**
   * Initializes the component by setting up the subscriptions for getting
   * the current user's UID and chat params, and then getting the messages for
   * the chat. The messages are then stored in the component and can be accessed
   * via the messages$ observable.
   */
  private initializeComponent(): void {
    this.getCurrentUserUidAndParams$()
      .pipe(
        switchMap(() => this.getMessagesForChat$()),
        takeUntil(this.destroy$)
      )
      .subscribe((messages) => (this.messages$ = of(messages)));
  }

  /**
   * A function that returns an observable that resolves to a void.
   * This function is used to get the current user's UID and the chat params
   * from the URL. It first gets the current user's UID using the auth service,
   * and then gets the chat params from the URL. It then assigns the current
   * user's UID to the component's property and the chat ID to the component's
   * property. Finally, it calls the initializeReceiverData function to
   * initialize the receiver data.
   */
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

  /**
   * Returns an observable that resolves to an array of messages for the
   * current chat. If there is an error fetching the messages, it will log
   * the error to the console and return an empty array.
   * @returns Observable that resolves to an array of messages
   */
  private getMessagesForChat$(): Observable<Message[]> {
    return this.firebaseService.getMessages('directMessages', this.chatId).pipe(
      catchError((error) => {
        console.error('Error fetching messages:', error);
        return of([]);
      })
    );
  }

  /**
   * Initializes the receiver data. This function gets the chat data stream
   * and pipes it to the getReceiverDataStream function. It then assigns the
   * result to the receiverData$ observable. It then calls the
   * setReceiverNameStream and setReceiverPhotoStream functions to set the
   * receiver name and receiver photo streams, respectively. Finally, it
   * calls the subscribeToReceiverData function to subscribe to the receiver
   * data stream.
   */
  private initializeReceiverData(): void {
    const chatData$ = this.getChatDataStream();
    const receiverData$ = this.getReceiverDataStream(chatData$);
    this.setReceiverNameStream(receiverData$);
    this.setReceiverPhotoStream(receiverData$);
    this.subscribeToReceiverData(receiverData$);
  }

  /**
   * Returns an observable that resolves to the chat data for the current chat,
   * or null if the chat does not exist. This function is used to initialize the
   * receiver data.
   * @returns Observable that resolves to the chat data for the current chat,
   * or null if the chat does not exist.
   */
  private getChatDataStream(): Observable<DirectMessage | null> {
    return this.route.params.pipe(
      switchMap((params) => this.getChatData(params['chatId']))
    );
  }

  /**
   * Returns an observable that resolves to the receiver data for the current chat,
   * or null if the chat does not exist. This function is used to initialize the
   * receiver data.
   * @param chatData$ An observable that resolves to the chat data for the current
   * chat, or null if the chat does not exist.
   * @returns Observable that resolves to the receiver data for the current chat,
   * or null if the chat does not exist.
   */
  private getReceiverDataStream(
    chatData$: Observable<DirectMessage | null>
  ): Observable<User> {
    return chatData$.pipe(
      switchMap((chatData) => this.getReceiverData(chatData))
    );
  }

  /**
   * Sets the receiverName$ observable stream to emit the name of the receiver
   * extracted from the provided receiver data observable. Defaults to 'Unknown User'
   * in case the user data is null or an error occurs.
   * @param receiverData$ An observable that emits user data, from which the receiver's
   * name is extracted.
   */
  private setReceiverNameStream(receiverData$: Observable<User>): void {
    this.receiverName$ = receiverData$.pipe(
      map((u) => u?.name || 'Unknown User'),
      catchError(() => of('Unknown User'))
    );
  }

  /**
   * Sets the receiverPhotoURL$ observable stream to emit the photo URL of the
   * receiver extracted from the provided receiver data observable. Defaults to
   * a placeholder image in case the user data is null or an error occurs.
   * @param receiverData$ An observable that emits user data, from which the
   * receiver's photo URL is extracted.
   */
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

  /**
   * Subscribes to the receiver data observable and updates the component's state with the
   * UID of the received user. If an error occurs while fetching the receiver data, it logs
   * the error to the console. The subscription is automatically unsubscribed when the component
   * is destroyed.
   * @param receiverData$ An observable emitting user data, which is subscribed to in order
   * to update the user's UID.
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
   * Retrieves chat data for a given chat ID from the 'directMessages' collection.
   * Sets the component's chatId property to the provided chat ID and returns an
   * observable that emits the corresponding DirectMessage object. In case of an
   * error during data retrieval, logs the error and returns an observable emitting null.
   * @param chatId The ID of the chat to fetch data for.
   * @returns An observable that emits a DirectMessage object or null in case of an error.
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
   * Returns an observable that resolves to the user data of the receiver for the
   * provided chat data, or the default user if the chat data is null or the receiver's
   * ID is not found in the chat data. Subscribes to the user data observable and
   * updates the component's state with the received user's UID. If an error occurs
   * while fetching the user data, it logs the error to the console and returns an
   * observable emitting the default user.
   * @param chatData The chat data to extract the receiver's ID from.
   * @returns An observable that emits the user data of the receiver or the default
   * user in case of an error.
   */
  private getReceiverData(chatData: DirectMessage | null): Observable<User> {
    const receiverId = this.extractReceiverIdFromChatData(chatData);
    if (!receiverId) return of(this.getDefaultUser());
    this.setUsersUid(receiverId);
    return this.getReceiverDataFromFirebase$(receiverId);
  }

  /**
   * Takes a DirectMessage object and returns the ID of the receiver of the chat.
   * The receiver is the user in the chat that is not the currently logged in user.
   * If the chat data is null or the receiver's ID is not found in the chat data,
   * returns null.
   * @param chatData The chat data to extract the receiver's ID from.
   * @returns The ID of the receiver or null if not found.
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
   * Takes a receiver ID and returns an observable that resolves to the user data of that receiver.
   * Subscribes to the user data observable and updates the component's state with the received user.
   * If an error occurs while fetching the user data, it logs the error to the console and returns an
   * observable emitting the default user.
   * @param receiverId The ID of the receiver to fetch the user data for.
   * @returns An observable that emits the user data of the receiver or the default user in case of an error.
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
