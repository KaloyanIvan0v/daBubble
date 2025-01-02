import { FirebaseServicesService } from './../../services/firebase/firebase.service';
import {
  Component,
  Input,
  ElementRef,
  EventEmitter,
  Output,
  OnInit,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from '../../models/user.class';
import { Observable, Subject, catchError, map, of, takeUntil } from 'rxjs';
import { FirebaseTimePipe } from 'src/app/shared/pipes/firebase-time.pipe';
import { WorkspaceService } from '../../services/workspace-service/workspace.service';
import { ReactionsMenuComponent } from './reactions-menu/reactions-menu.component';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../services/emoji-picker/emoji-picker.service';
import { AuthService } from '../../services/auth-services/auth.service';
import { ThreadService } from '../../services/thread-service/thread.service';
import { StatefulWindowServiceService } from '../../services/stateful-window-service/stateful-window-service.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [
    CommonModule,
    FirebaseTimePipe,
    ReactionsMenuComponent,
    EmojiPickerComponent,
  ],
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit, OnDestroy {
  @Input() message!: Message;
  @Input() showThread: boolean = true;
  @Input() editActive: boolean = false;
  @Output() messageToEdit = new EventEmitter<Message>();

  author$: Observable<User> = new Observable();
  showEmojiPicker = false;
  loggedInUserId: string | null = '';
  containerRef!: ElementRef;
  lastTwoReactions: string[] = [];
  threadMessages: Message[] = [];
  lastThreadMessage: Message | null = null;
  usersUid: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private emojiPickerService: EmojiPickerService,
    private authService: AuthService,
    private threadService: ThreadService,
    private statefulWindowService: StatefulWindowServiceService
  ) {}

  ngOnInit() {
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
      this.setLastTwoReactions();
    });
    this.setAuthor();
    this.setThreadMessagesLength();
    this.configSpaceUids();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.setAuthor();
    }
  }

  configSpaceUids() {
    if (this.isChannel()) {
      this.getChannelUsers();
    } else {
      this.getDirectChatUserUid();
    }
  }

  isChannel() {
    if (this.message.location !== '') {
      return this.message.location.split('/')[1] === 'channels';
    } else {
      return false;
    }
  }

  getChannelUsers() {
    const channelId = this.message.location.split('/')[2];
    this.firebaseService
      .getChannel(channelId)
      .pipe(first())
      .subscribe((channel) => {
        this.usersUid = channel.uid;
      });
  }

  getDirectChatUserUid() {
    if (this.message.receiverId) {
      this.usersUid.push(this.message.receiverId);
    }
  }

  setAuthor() {
    this.author$ = this.firebaseService.getUser(this.message.author).pipe(
      catchError(() =>
        of({
          uid: '',
          name: 'Unbekannt',
          email: '',
          photoURL: '',
          contacts: [],
          status: false,
        } as User)
      )
    );
  }

  setThreadMessagesLength() {
    this.firebaseService
      .getThreadMessages(
        this.message.location + '/' + this.message.id + '/messages'
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((threads) => {
        this.threadMessages = threads;
        this.lastThreadMessage =
          this.threadMessages[this.threadMessages.length - 1] || null;
      });
  }

  setEditMessage($event: Message) {
    this.messageToEdit.emit($event);
    this.setEditActive();
  }

  setLastTwoReactions() {
    const reactions = this.message?.reactions || [];
    this.lastTwoReactions = Array(2)
      .fill('')
      .map((_, index) => reactions[reactions.length - 2 + index]?.value || '');
  }
  onEmojiSelected(emoji: string) {
    this.emojiPickerService.addReaction(emoji, this.message);
    this.setLastTwoReactions();
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  openAuthorProfile(authorId: string) {
    this.workspaceService.currentActiveUserId.set(authorId);
    this.workspaceService.profileViewPopUp.set(true);
  }

  getAuthorName(uid: string): Observable<string> {
    return this.firebaseService
      .getUser(uid)
      .pipe(map((user: any) => user?.name || 'Unbekannt'));
  }

  openThread() {
    this.threadService.openThread(this.message);
    this.statefulWindowService.openRightSideComponentState();
    this.threadService.channelUsersUid.next(this.usersUid);
  }

  cancelEdit() {
    this.editActive = false;
    this.messageToEdit.emit(undefined);
  }

  setEditActive() {
    this.editActive = true;
  }
}
