import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Observable, Subscription } from 'rxjs';
import { first, map } from 'rxjs/operators';
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
  styleUrls: ['./right-side-container.component.scss'],
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
  userName: string = 'user';

  /**
   * Initializes the RightSideContainerComponent, sets up a subscription for the current thread path,
   * and loads thread data when a valid path is detected.
   * @param workspaceService Service that manages workspace-related state.
   * @param firebaseService Service that handles Firebase operations.
   * @param threadService Service for thread-related logic and data.
   * @param statefulWindowService Manages window/responsive state.
   */
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

  /**
   * Lifecycle hook that is called after component initialization.
   * Subscribes to the originMessage and sets the channelUsersUid array.
   */
  ngOnInit(): void {
    this.threadService.originMessage.subscribe((message) => {
      this.originMessage = message;
    });
    this.setChannelUsersUid();
  }

  /**
   * Handles the event when a message is being edited.
   * @param $event The message to edit.
   */
  messageToEditHandler($event: Message): void {
    this.messageToEdit = $event;
  }

  /**
   * Retrieves a user's data by UID. Currently not used to set a local property.
   * @param userUid The UID of the user to retrieve.
   */
  getUserName(userUid: string | null | undefined): void {
    if (userUid) {
      this.firebaseService.getUser(userUid);
    }
  }

  /**
   * Checks whether the origin of the message is a channel.
   * @returns True if the location indicates a channel, otherwise false.
   */
  isCannel(): boolean {
    return this.originMessage?.location.split('/')[1] === 'channels';
  }

  /**
   * Extracts and logs the receiver UID from the given message.
   * @param message The message containing the thread path.
   */
  getReceiverUid(message: Message): void {
    if (message) {
      console.log('message', message);
      const uids: string[] = [];
      uids.push(message.thread.originMessagePath.split('/')[2]);
      console.log(uids);
    }
  }

  /**
   * Loads messages for the current thread from Firestore and subscribes to updates.
   */
  loadThread(): void {
    this.messages$ = this.firebaseService.getThreadMessages(this.threadPath);
    this.messagesSubscription = this.messages$.subscribe((messages) => {
      if (messages) {
        this.messages = messages;
      }
    });
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  /**
   * Opens the Edit Channel pop-up.
   */
  openEditChannelPopUp(): void {
    this.workspaceService.editChannelPopUp.set(true);
  }

  /**
   * Opens the Add User to Channel pop-up.
   */
  openAddUserToChannelPopUp(): void {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  /**
   * Opens the Channel Members pop-up.
   */
  openChannelUsersViewPopUp(): void {
    this.workspaceService.channelMembersPopUp.set(true);
  }

  /**
   * Closes the thread view (right side container), particularly on mobile screens.
   */
  closeThread(): void {
    this.statefulWindowService.closeRightSideComponentState();
    this.statefulWindowService.setMobileViewMode('left');
  }

  /**
   * Indicates whether the right side component is currently open.
   */
  get rightSideComponentOpen(): boolean {
    return this.statefulWindowService.rightSideComponentState();
  }

  /**
   * Updates the local channelUsersUid array from the ThreadService subscription.
   */
  setChannelUsersUid(): void {
    this.threadService.channelUsersUid.subscribe((uids) => {
      this.channelUsersUid = uids;
    });
  }

  /**
   * Retrieves the user's name by UID, returning an observable that will emit a single value.
   * @param userUid The UID of the user.
   * @returns An observable stream that emits the user's name.
   */
  getName(userUid: string): Observable<string> {
    return this.firebaseService.getUser(userUid).pipe(
      first(),
      map((user) => user.name)
    );
  }
}
