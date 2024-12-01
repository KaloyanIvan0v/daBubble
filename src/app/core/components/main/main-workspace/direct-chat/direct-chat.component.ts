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
import { Message } from 'src/app/core/shared/models/message.class';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';

@Component({
  selector: 'app-direct-chat',
  templateUrl: './direct-chat.component.html',
  styleUrls: ['./direct-chat.component.scss'],
  standalone: true,
  imports: [InputBoxComponent, CommonModule],
})
export class DirectChatComponent implements OnInit, OnDestroy {
  chatId: string = '';
  currentUserUid: string = '';
  receiverId: string | null | undefined = null;
  receiverName$: Observable<string> = of('Name Placeholder');
  receiverPhotoURL$: Observable<string> = of(
    '/assets/img/profile-img/profile-img-placeholder.svg'
  );

  messages: Message[] = [];

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

  private initializeComponent(): void {
    this.authService.getCurrentUserUID().then((uid) => {
      this.currentUserUid = uid ?? '';
      this.initializeReceiverData();
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
}
