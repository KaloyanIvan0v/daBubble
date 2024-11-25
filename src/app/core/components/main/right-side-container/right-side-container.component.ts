import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Observable, Subscription } from 'rxjs';
import { Message } from 'src/app/core/shared/models/message.class';
import { MessageComponent } from 'src/app/core/shared/components/message/message.component';
import { RouterModule } from '@angular/router';
import { Thread } from 'src/app/core/shared/models/thread.class';
import { ThreadService } from 'src/app/core/shared/services/thread-service/thread.service';
@Component({
  selector: 'app-right-side-container',
  standalone: true,
  imports: [
    RouterModule,
    InputBoxComponent,
    FormsModule,
    CommonModule,
    MessageComponent,
  ],
  templateUrl: './right-side-container.component.html',
  styleUrl: './right-side-container.component.scss',
})
export class RightSideContainerComponent {
  private subscriptions = new Subscription();
  private messagesSubscription?: Subscription;
  private lastMessageLength: number = 0;
  messages$!: Observable<Message[]>;
  messages: Message[] = [];
  messageToEdit: Message | null = null;
  threadPath: string = '';
  threadOpen: boolean = false;
  messagePath: string = '';
  originMessage!: Message | null;
  threadData: Thread = new Thread('', '');

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    private threadService: ThreadService
  ) {
    this.threadService.currentThreadPath.subscribe((path) => {
      this.threadPath = path;
      if (this.threadPath !== '') {
        this.loadThread();
      }
    });
  }

  ngOnInit(): void {
    this.threadService.originMessage.subscribe((message) => {
      this.originMessage = message;
    });
  }

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    }
  }

  private checkForNewMessages(): void {
    if (this.lastMessageLength !== this.messages.length) {
      this.scrollToBottom();
      this.lastMessageLength = this.messages.length;
    }
  }

  loadThread(): void {
    this.messages$ = this.firebaseService.getThreadMessages(this.threadPath);

    this.messagesSubscription = this.messages$.subscribe((messages) => {
      if (messages) {
        this.messages = messages;
        setTimeout(() => {
          this.checkForNewMessages();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  openEditChannelPopUp() {
    this.workspaceService.editChannelPopUp.set(true);
  }

  openAddUserToChannelPopUp() {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  openChannelUsersViewPopUp() {
    this.workspaceService.channelMembersPopUp.set(true);
  }

  closeThread() {
    this.threadService.threadOpen.next(false);
  }
}
