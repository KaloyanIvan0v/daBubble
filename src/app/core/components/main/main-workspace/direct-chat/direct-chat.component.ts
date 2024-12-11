import { Component, OnInit, OnDestroy } from '@angular/core';
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
  receiverId: string | null | undefined = null;
  receiverName$: Observable<string> = of('Name Placeholder');
  receiverPhotoURL$: Observable<string> = of(
    '/assets/img/profile-img/profile-img-placeholder.svg'
  );

  messages$!: Observable<Message[]>;
  messages: Message[] = [];
  messageToEdit: Message | undefined = undefined;
  usersUid: string[] = [];

  private subscriptions: Subscription = new Subscription();

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
    this.subscriptions.unsubscribe();
  }

  messageToEditHandler($event: Message): void {
    this.messageToEdit = $event;
  }

  setUsersUid(usersUid: string): void {
    this.usersUid = [];
    this.usersUid.push(usersUid);
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
        this.setUsersUid(this.receiverId);
        return this.firebaseService
          .getUser(this.receiverId)
          .pipe(map((user) => user || this.getDefaultUser()));
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

  openProfileView(uid: string) {
    this.workspaceService.currentActiveUserId.set(uid);
    this.workspaceService.profileViewPopUp.set(true);
  }

  private subscribeToMessages(chatId: string): void {
    if (this.messages$) {
      this.subscriptions.unsubscribe();
      this.subscriptions = new Subscription();
    }
    this.firebaseService
      .getMessages('directMessages', chatId)
      .subscribe((messages) => {
        this.messages = messages;
        this.messages$ = of(messages);
      });
  }

  get messagePath(): string {
    return `/directMessages/${this.chatId}/messages`;
  }
}
