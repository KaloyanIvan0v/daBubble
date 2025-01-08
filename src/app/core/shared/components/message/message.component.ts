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

  /**
   * Constructs the MessageComponent with necessary service dependencies.
   * @param firebaseService Service for interacting with Firebase.
   * @param workspaceService Service for managing workspace-related data.
   * @param emojiPickerService Service for handling emoji picker interactions.
   * @param authService Service for authentication and user information.
   * @param threadService Service for managing message threads.
   * @param statefulWindowService Service for managing the state of window components.
   */
  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private emojiPickerService: EmojiPickerService,
    private authService: AuthService,
    private threadService: ThreadService,
    private statefulWindowService: StatefulWindowServiceService
  ) {}

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   * Initializes user ID, author data, thread messages, and user UIDs.
   */
  ngOnInit() {
    this.configSpaceUids();
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
      this.setLastTwoReactions();
    });
    this.setAuthor();
    this.setThreadMessagesLength();
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Cleans up subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Lifecycle hook that is called when any data-bound property changes.
   * Updates the author information if the message input changes.
   * @param changes Object containing the changed properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.setAuthor();
    }
  }

  /**
   * Configures user UIDs based on whether the message is in a channel or direct chat.
   */
  configSpaceUids() {
    if (this.isChannel()) {
      this.getChannelUsers();
    } else {
      this.getDirectChatUserUid();
    }
  }

  /**
   * Determines if the message is part of a channel based on its location.
   * @returns True if the message is in a channel; otherwise, false.
   */
  isChannel(): boolean {
    if (this.message.location !== '') {
      return this.message.location.split('/')[1] === 'channels';
    } else {
      return false;
    }
  }

  /**
   * Retrieves the UIDs of users in the channel where the message was sent.
   */
  getChannelUsers() {
    const channelId = this.message.location.split('/')[2];
    this.firebaseService
      .getChannel(channelId)
      .pipe(first())
      .subscribe((channel) => {
        if (!channel) return;
        this.usersUid = channel.uid;
      });
  }

  /**
   * Retrieves the UID of the user in a direct chat context.
   */
  getDirectChatUserUid() {
    if (this.message.receiverId) {
      this.usersUid.push(this.message.receiverId);
    }
  }

  /**
   * Sets the author observable by fetching user data from Firebase.
   * Provides a fallback user object in case of an error.
   */
  setAuthor() {
    this.author$ = this.firebaseService.getUser(this.message.author).pipe(
      catchError(() =>
        of({
          uid: '',
          name: 'Unknown',
          email: '',
          photoURL: '',
          contacts: [],
          status: false,
        } as User)
      )
    );
  }

  /**
   * Retrieves and sets the messages in the thread associated with this message.
   */
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

  /**
   * Emits the selected message for editing and activates edit mode.
   * @param $event The message to be edited.
   */
  setEditMessage($event: Message) {
    this.messageToEdit.emit($event);
    this.setEditActive();
  }

  /**
   * Extracts and sets the last two reactions to the message.
   */
  setLastTwoReactions() {
    const reactions = this.message?.reactions || [];
    this.lastTwoReactions = Array(2)
      .fill('')
      .map((_, index) => reactions[reactions.length - 2 + index]?.value || '');
  }

  /**
   * Handles the selection of an emoji from the emoji picker.
   * Adds the reaction to the message and updates the last two reactions.
   * @param emoji The selected emoji.
   */
  onEmojiSelected(emoji: string) {
    this.emojiPickerService.addReaction(emoji, this.message);
    this.setLastTwoReactions();
  }

  /**
   * Toggles the visibility of the emoji picker.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Closes the emoji picker.
   */
  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  /**
   * Opens the profile of the message's author.
   * @param authorId The UID of the author.
   */
  openAuthorProfile(authorId: string) {
    this.workspaceService.currentActiveUserId.set(authorId);
    this.workspaceService.profileViewPopUp.set(true);
  }

  /**
   * Retrieves the name of the author based on their UID.
   * @param uid The UID of the user.
   * @returns An observable emitting the user's name or 'Unknown' if not found.
   */
  getAuthorName(uid: string): Observable<string> {
    return this.firebaseService
      .getUser(uid)
      .pipe(map((user: any) => user?.name || 'Unknown'));
  }

  /**
   * Opens the thread associated with the current message.
   * Configures the stateful window and passes relevant user UIDs.
   */
  openThread() {
    this.threadService.openThread(this.message);
    this.statefulWindowService.openRightSideComponentState();
    this.threadService.channelUsersUid.next(this.usersUid);
    this.statefulWindowService.setMobileViewMode('thread');
  }

  /**
   * Cancels the edit mode and emits an undefined value to indicate no message is being edited.
   */
  cancelEdit() {
    this.editActive = false;
    this.messageToEdit.emit(undefined);
  }

  /**
   * Activates the edit mode for the message.
   */
  setEditActive() {
    this.editActive = true;
  }
}
