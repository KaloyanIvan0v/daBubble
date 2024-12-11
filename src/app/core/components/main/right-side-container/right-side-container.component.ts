import { Component } from '@angular/core';
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
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';
import { ChatComponent } from 'src/app/core/shared/components/chat/chat.component';
@Component({
  selector: 'app-right-side-container',
  standalone: true,
  imports: [
    RouterModule,
    InputBoxComponent,
    FormsModule,
    CommonModule,
    MessageComponent,
    ChatComponent,
  ],
  templateUrl: './right-side-container.component.html',
  styleUrl: './right-side-container.component.scss',
})
export class RightSideContainerComponent {
  private subscriptions = new Subscription();
  private messagesSubscription?: Subscription;
  messages$!: Observable<Message[]>;
  messages: Message[] = [];
  messageToEdit: Message | undefined = undefined;
  threadPath: string = '';
  threadOpen: boolean = false;
  messagePath: string = '';
  originMessage!: Message | null;
  threadData: Thread = new Thread('', '');
  channelUsersUid: string[] = [];

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService,
    private threadService: ThreadService,
    private statefulWindowService: StatefulWindowServiceService
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
    this.setChannelUsersUid();
  }

  messageToEditHandler($event: Message): void {
    this.messageToEdit = $event;
  }

  loadThread(): void {
    this.messages$ = this.firebaseService.getThreadMessages(this.threadPath);

    this.messagesSubscription = this.messages$.subscribe((messages) => {
      if (messages) {
        this.messages = messages;
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
    this.statefulWindowService.closeRightSideComponentState();
  }

  get rightSideComponentOpen() {
    return this.statefulWindowService.rightSideComponentState();
  }

  setChannelUsersUid() {
    this.threadService.channelUsersUid.subscribe((uids) => {
      this.channelUsersUid = uids;
    });
  }
}
