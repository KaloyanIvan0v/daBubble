import { FirebaseServicesService } from './../../services/firebase/firebase.service';
import {
  Component,
  Input,
  ElementRef,
  EventEmitter,
  Output,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from '../../models/user.class';
import { Observable, map } from 'rxjs';
import { FirebaseTimePipe } from 'src/app/shared/pipes/firebase-time.pipe';
import { WorkspaceService } from '../../services/workspace-service/workspace.service';
import { ReactionsMenuComponent } from './reactions-menu/reactions-menu.component';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { EmojiPickerService } from '../../services/emoji-picker/emoji-picker.service';
import { AuthService } from '../../services/auth-services/auth.service';
import { ThreadService } from '../../services/thread-service/thread.service';

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
  styleUrl: './message.component.scss',
})
export class MessageComponent implements OnInit {
  @Input() message!: Message;
  @Input() showThread: boolean = true;
  author$: Observable<User> = new Observable();
  showEmojiPicker = false;
  loggedInUserId: string | null = '';
  containerRef!: ElementRef;
  lastTwoReactions: string[] = [];
  threadMessages: Message[] = [];
  @Output() messageToEdit = new EventEmitter<Message>();
  lastThreadMessage: Message | null = null;

  //@ViewChild('messageElement', { static: true }) messageElement!: ElementRef;
  //popupDirection: 'up' | 'down' = 'down';

  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private emojiPickerService: EmojiPickerService,
    private authService: AuthService,
    private threadService: ThreadService
  ) {
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
      this.setLastTwoReactions();
    });
  }

  ngOnInit() {
    this.author$ = this.firebaseService.getUser(this.message.author);
    this.setThreadMessagesLength();
  }

  setThreadMessagesLength() {
    this.firebaseService
      .getThreadMessages(
        this.message.location + '/' + this.message.id + '/messages'
      )
      .subscribe((threads) => {
        this.threadMessages = threads;

        // Set the last message
        this.lastThreadMessage =
          this.threadMessages[this.threadMessages.length - 1] || null;
      });
  }

  setMessageToEdit($event: any) {
    this.messageToEdit.emit($event);
  }

  setLastTwoReactions() {
    const reactions = this.message.reactions
      .slice(-2)
      .map((reaction) => reaction?.value || '');
    this.lastTwoReactions = [reactions[0] || '', reactions[1] || ''];
  }

  onEmojiSelected(emoji: string) {
    this.emojiPickerService.addReaction(emoji, this.message);
    this.setLastTwoReactions();
  }

  toggleEmojiPicker() {
    //this.calculatePopupDirection();
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
    this.threadService.threadOpen.next(true);
  }

  // calculatePopupDirection() {
  //   const messageRect =
  //     this.messageElement.nativeElement.getBoundingClientRect();
  //   const containerRect =
  //     this.containerRef.nativeElement.getBoundingClientRect();

  //   const distanceToBottom = containerRect.bottom - messageRect.bottom;

  //   if (distanceToBottom <= 200) {
  //     this.popupDirection = 'up';
  //   } else {
  //     this.popupDirection = 'down';
  //   }
  // }
}
