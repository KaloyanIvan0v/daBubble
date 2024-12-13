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
    from(this.authService.getCurrentUserUID())
      .pipe(
        switchMap((uid) => {
          this.currentUserUid = uid ?? '';
          return this.route.params;
        }),
        switchMap((params) => {
          this.chatId = params['chatId'];
          this.initializeReceiverData();
          return this.firebaseService
            .getMessages('directMessages', this.chatId)
            .pipe(
              catchError((error) => {
                console.error('Error fetching messages:', error);
                return of([]);
              })
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((messages) => {
        this.messages$ = of(messages);
      });
  }

  private initializeReceiverData(): void {
    const chatData$ = this.route.params.pipe(
      switchMap((params) => this.getChatData(params['chatId']))
    );

    const receiverData$ = chatData$.pipe(
      switchMap((chatData) => this.getReceiverData(chatData))
    );

    this.receiverName$ = receiverData$.pipe(
      map((user) => user?.name || 'Unknown User'),
      catchError(() => of('Unknown User'))
    );

    this.receiverPhotoURL$ = receiverData$.pipe(
      map(
        (user) =>
          user?.photoURL ||
          '/assets/img/profile-img/profile-img-placeholder.svg'
      ),
      catchError(() =>
        of('/assets/img/profile-img/profile-img-placeholder.svg')
      )
    );

    receiverData$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user) => {
        if (user) {
          this.setUsersUid(user.uid);
        }
      },
      error: (err) => {
        console.error('Error fetching receiver data:', err);
      },
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
    if (chatData?.uid && Array.isArray(chatData.uid)) {
      const receiverId =
        chatData.uid.find((uid) => uid !== this.currentUserUid) || null;
      this.receiverId = receiverId;
      if (receiverId) {
        this.setUsersUid(receiverId);
        return this.firebaseService.getUser(receiverId).pipe(
          map((user) => user || this.getDefaultUser()),
          catchError((error) => {
            console.error('Error fetching receiver user data:', error);
            return of(this.getDefaultUser());
          })
        );
      }
    }
    return of(this.getDefaultUser());
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
