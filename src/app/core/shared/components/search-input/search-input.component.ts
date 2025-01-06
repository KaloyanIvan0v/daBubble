import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from '../../services/workspace-service/workspace.service';
import { ShowUserPipe } from 'src/app/shared/pipes/show-user.pipe';
import { StatefulWindowServiceService } from '../../services/stateful-window-service/stateful-window-service.service';
import { ThreadService } from './../../services/thread-service/thread.service';
import { Message } from 'src/app/core/shared/models/message.class';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, ShowUserPipe],
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
})
export class SearchInputComponent implements OnInit, OnDestroy {
  allMessages: Message[] = [];
  filteredMessages: Message[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private firebaseService: FirebaseServicesService,
    private router: Router,
    private workspaceService: WorkspaceService,
    private statefulWindowService: StatefulWindowServiceService,
    private threadService: ThreadService
  ) {}

  ngOnInit() {
    this.loadAllMessages();
  }

  /**
   * Loads all messages once.
   */
  private loadAllMessages(): void {
    const sub = this.firebaseService.getAllMessages().subscribe((messages) => {
      this.allMessages = messages;
    });
    this.subscriptions.push(sub);
  }

  /**
   * Handles search input events by filtering and sorting messages.
   */
  onSearch(event: Event) {
    const inputText = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.filteredMessages = inputText
      ? this.filterAndSortMessages(inputText)
      : [];
  }

  /**
   * Filters and sorts existing messages based on the given query.
   * Messages starting with the query string get higher priority.
   */
  private filterAndSortMessages(query: string): Message[] {
    return this.allMessages
      .filter((msg) => msg.value.text.toLowerCase().includes(query))
      .sort((a, b) => {
        const aText = a.value.text.toLowerCase();
        const bText = b.value.text.toLowerCase();

        // Give priority to messages that start with the query string
        const aStarts = aText.startsWith(query) ? 0 : 1;
        const bStarts = bText.startsWith(query) ? 0 : 1;
        return aStarts - bStarts;
      });
  }

  /**
   * Clears the current search and empties the input field.
   */
  clearSearch() {
    this.filteredMessages = [];
    this.clearInput();
  }

  /**
   * Empties the search input field if it exists.
   */
  private clearInput() {
    const input = document.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Opens a specific message in its channel/chat and closes the search.
   */
  openMessage(message: Message) {
    this.clearSearch();
    this.navigateToMessage(message);
  }

  /**
   * Navigates to the appropriate route (channel or direct chat) based on the message path.
   */
  private navigateToMessage(message: Message) {
    const [, collectionName, spaceId] = message.location.split('/');
    const messageId = message.id;
    const routeType =
      collectionName === 'channels' ? 'channel-chat' : 'direct-chat';

    this.router.navigate(['dashboard', routeType, spaceId], {
      queryParams: { messageId },
    });
    this.workspaceService.currentActiveUnitId.set(spaceId);
    this.handleMobileNavigation(message);
  }

  handleMobileNavigation(message: Message) {
    if (this.isThread(message.location)) {
      this.threadService.openThread(this.getOriginMessage(message.location));
      this.statefulWindowService.currentActiveComponentMobile.set('thread');
      this.statefulWindowService.openRightSideComponentState();
    } else {
      this.statefulWindowService.currentActiveComponentMobile.set('chat');
    }
  }

  getOriginMessage(threadPath: string) {
    return this.allMessages.find(
      (msg) =>
        msg.thread.originMessagePath === this.getOriginMessagePath(threadPath)
    );
  }

  getOriginMessagePath(threadPath: string) {
    return threadPath.split('/').slice(0, 5).join('/');
  }

  isThread(msgPath: string): boolean {
    const pathLength = msgPath.split('/').length;
    return pathLength > 4;
  }

  /**
   * Utility to check if the current viewport is mobile-sized.
   */
  isMobile(): boolean {
    return window.innerWidth < 960;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
