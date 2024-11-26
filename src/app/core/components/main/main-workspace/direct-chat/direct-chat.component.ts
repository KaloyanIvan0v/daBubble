import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Message } from 'src/app/core/shared/models/message.class';
import { Thread } from 'src/app/core/shared/models/thread.class';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { MainService } from '../../main.service';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
@Component({
  selector: 'app-direct-chat',
  templateUrl: './direct-chat.component.html',
  styleUrls: ['./direct-chat.component.scss'],
  standalone: true,
  imports: [InputBoxComponent, CommonModule],
})
export class DirectChatComponent implements OnInit, OnDestroy {
  chatId: string = ''; // Chat ID, extracted from route or passed
  currentUser: string = ''; // Logged-in user
  messages: Message[] = []; // List of messages in the chat
  newMessageText: string = ''; // New message input text
  newMessageImports: string[] = []; // List of imports for the message (you can customize this)
  thread: Thread = new Thread('threadId', 'threadName');
  space: string = ''; // Define space for messages (e.g., "directChat")
  receiverId: string | null = null; // Optional receiver ID for direct messages

  receiverName: string = ''; // Receiver's name
  receiverPhotoURL: string = ''; // Receiver's profile photo URL

  private messagesSubscription: Subscription = Subscription.EMPTY;
  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseServicesService,
    private authService: AuthService,
    private mainService: MainService
  ) {}

  ngOnInit(): void {
    // Get the chatId from the route params
    this.route.params.subscribe((params) => {
      this.chatId = params['chatId'];
      this.loadMessages(); // Load the messages after chatId is available
    });

    // Get the logged-in user's UID
    this.authService.getCurrentUserUID().then((uid) => {
      this.currentUser = uid ?? '';
    });
  }

  ngOnDestroy(): void {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  loadMessages(): void {
    // Use your getMessages method to load messages from the Firestore
    this.messagesSubscription = this.firebaseService
      .getMessages('directMessages', this.chatId)
      .subscribe((messages: Message[]) => {
        this.messages = messages; // Update messages array with the fetched data
      });
  }

  sendMessage(): void {
    if (this.newMessageText.trim() === '') return;

    const inputMessage: InputBoxData = {
      message: this.newMessageText,
      imports: this.newMessageImports,
    };

    this.mainService
      .sendMessage(
        `directMessages/${this.chatId}/messages`,
        inputMessage,
        this.receiverId
      )
      .then(() => {
        // Clear the input fields after sending
        this.newMessageText = '';
        this.newMessageImports = [];
      })
      .catch((error) => {
        console.error('Error sending message:', error);
      });
  }
}
