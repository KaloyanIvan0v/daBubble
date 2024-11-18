import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Subscription } from 'rxjs';
import { Chat } from 'src/app/core/shared/models/chat.class';
import { User } from 'src/app/core/shared/models/user.class';
import { Message } from 'src/app/core/shared/models/message.class';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [FormsModule, CommonModule, InputBoxComponent],
  templateUrl: './direct-chat.component.html',
  styleUrls: ['./direct-chat.component.scss'],
})
export class DirectChatComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  private subscriptions = new Subscription();
  private chatSubscription?: Subscription;

  loggedInUserId: string = ''; // ID of the logged-in user
  dmChat?: Chat; // Instance of Chat representing the DM session
  dmUser?: User; // Instance of the User class for the other user
  messages: Message[] = []; // Array to hold messages
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService
  ) {
    // Subscribe to the current active DM user to update the component when it changes
    effect(() => {
      const activeDmUser = this.workspaceService.currentActiveDmUser(); // Get the active DM user
      if (activeDmUser) {
        // this.dmUser = activeDmUser; // Set the dmUser to the active DM user
      } else {
        console.warn('No valid DM user available.');
      }
    });
  }

  ngOnInit(): void {
    this.loggedInUserId = this.workspaceService.currentActiveUserId();
  }

  // Auto-scroll to the latest message
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    }
  }

  ngOnDestroy(): void {
    this.chatSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }
}
