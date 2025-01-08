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

  ngOnInit(): void {
    this.loadAllMessages();
  }

  /**
   * Loads all messages from the Firebase service and subscribes to updates.
   */
  private loadAllMessages(): void {
    const sub = this.firebaseService.getAllMessages().subscribe((messages) => {
      this.allMessages = messages;
    });
    this.subscriptions.push(sub);
  }

  /**
   * Handles search input events by filtering and sorting messages.
   * @param {Event} event - The search input event.
   */
  onSearch(event: Event): void {
    const inputText = this.getInputText(event);
    this.filteredMessages = inputText
      ? this.filterAndSortMessages(inputText)
      : [];
  }

  /**
   * Extracts and processes the input text from the search event.
   * @param {Event} event - The search input event.
   * @returns {string} - The processed input text.
   */
  private getInputText(event: Event): string {
    return (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  /**
   * Filters and sorts existing messages based on the given query.
   * Messages starting with the query string get higher priority.
   * @param {string} query - The search query string.
   * @returns {Message[]} - The filtered and sorted messages.
   */
  private filterAndSortMessages(query: string): Message[] {
    return this.allMessages
      .filter((msg) => msg.value.text.toLowerCase().includes(query))
      .sort((a, b) => this.compareMessages(a, b, query));
  }

  /**
   * Compares two messages to prioritize those that start with the query string.
   * @param {Message} a - The first message.
   * @param {Message} b - The second message.
   * @param {string} query - The search query string.
   * @returns {number} - Comparison result for sorting.
   */
  private compareMessages(a: Message, b: Message, query: string): number {
    const aStarts = a.value.text.toLowerCase().startsWith(query) ? 0 : 1;
    const bStarts = b.value.text.toLowerCase().startsWith(query) ? 0 : 1;
    return aStarts - bStarts;
  }

  /**
   * Clears the current search results and empties the input field.
   */
  clearSearch(): void {
    this.filteredMessages = [];
    this.clearInput();
  }

  /**
   * Empties the search input field if it exists.
   */
  private clearInput(): void {
    const input = document.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Opens a specific message in its channel/chat and closes the search.
   * @param {Message} message - The message to open.
   */
  openMessage(message: Message): void {
    this.clearSearch();
    this.navigateToMessage(message);
  }

  /**
   * Navigates to the appropriate route (channel or direct chat) based on the message path.
   * @param {Message} message - The message to navigate to.
   */
  private navigateToMessage(message: Message): void {
    const { routeType, spaceId } = this.getRouteInfo(message.location);
    this.router.navigate(['dashboard', routeType, spaceId], {
      queryParams: { messageId: message.id },
    });
    this.workspaceService.currentActiveUnitId.set(spaceId);
    this.handleMobileNavigation(message);
  }

  /**
   * Extracts routing information from the message location.
   * @param {string} location - The location string from the message.
   * @returns {{ routeType: string; spaceId: string }} - The routing type and space ID.
   */
  private getRouteInfo(location: string): {
    routeType: string;
    spaceId: string;
  } {
    const [, collectionName, spaceId] = location.split('/');
    const routeType =
      collectionName === 'channels' ? 'channel-chat' : 'direct-chat';
    return { routeType, spaceId };
  }

  /**
   * Handles mobile-specific navigation logic based on the message.
   * @param {Message} message - The message to navigate to.
   */
  private handleMobileNavigation(message: Message): void {
    if (this.isThread(message.location)) {
      this.openThread(message.location);
    } else {
      this.setActiveComponent('chat');
    }
  }

  /**
   * Opens a thread based on the message location.
   * @param {string} location - The location string from the message.
   */
  private openThread(location: string): void {
    const originMessage = this.getOriginMessage(location);
    this.threadService.openThread(originMessage);
    this.setActiveComponent('thread');
    this.statefulWindowService.openRightSideComponentState();
  }

  /**
   * Sets the active component for mobile navigation.
   * @param {string} component - The component to set as active.
   */
  private setActiveComponent(component: 'chat' | 'left' | 'thread'): void {
    this.statefulWindowService.currentActiveComponentMobile.set(component);
  }

  /**
   * Retrieves the origin message based on the thread path.
   * @param {string} threadPath - The thread path string.
   * @returns {Message | undefined} - The origin message, if found.
   */
  private getOriginMessage(threadPath: string): Message | undefined {
    const originPath = this.getOriginMessagePath(threadPath);
    return this.allMessages.find(
      (msg) => msg.thread.originMessagePath === originPath
    );
  }

  /**
   * Extracts the origin message path from the thread path.
   * @param {string} threadPath - The thread path string.
   * @returns {string} - The origin message path.
   */
  private getOriginMessagePath(threadPath: string): string {
    return threadPath.split('/').slice(0, 5).join('/');
  }

  /**
   * Determines if the message path corresponds to a thread.
   * @param {string} msgPath - The message path string.
   * @returns {boolean} - True if it's a thread, otherwise false.
   */
  private isThread(msgPath: string): boolean {
    return msgPath.split('/').length > 4;
  }

  /**
   * Utility to check if the current viewport is mobile-sized.
   * @returns {boolean} - True if the viewport is mobile-sized, otherwise false.
   */
  isMobile(): boolean {
    return window.innerWidth < 960;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
