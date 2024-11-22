import { FirebaseServicesService } from './../../services/firebase/firebase.service';
import { Component, Input, ElementRef, ViewChild } from '@angular/core';
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
export class MessageComponent {
  @Input() message!: Message;
  author$: Observable<User> = new Observable();
  showEmojiPicker = false;
  loggedInUserId: string | null = '';
  containerRef!: ElementRef;
  @ViewChild('messageElement', { static: true }) messageElement!: ElementRef;
  popupDirection: 'up' | 'down' = 'down';

  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService,
    private emojiPickerService: EmojiPickerService,
    private authService: AuthService
  ) {
    this.authService.getCurrentUserUID().then((uid) => {
      this.loggedInUserId = uid;
    });
  }

  onEmojiSelected(emoji: string) {
    this.emojiPickerService.addReaction(emoji, this.message);
  }

  toggleEmojiPicker() {
    //this.calculatePopupDirection();
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }

  ngOnInit(): void {
    this.author$ = this.firebaseService.getUser(this.message.author);
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

  calculatePopupDirection() {
    const messageRect =
      this.messageElement.nativeElement.getBoundingClientRect();
    const containerRect =
      this.containerRef.nativeElement.getBoundingClientRect();

    const distanceToBottom = containerRect.bottom - messageRect.bottom;

    if (distanceToBottom <= 200) {
      this.popupDirection = 'up';
    } else {
      this.popupDirection = 'down';
    }
  }
}
