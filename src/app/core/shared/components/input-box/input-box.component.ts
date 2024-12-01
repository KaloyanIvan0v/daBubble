import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Message } from 'src/app/core/shared/models/message.class';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { FormsModule } from '@angular/forms';
import { MainService } from 'src/app/core/components/main/main.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { AuthService } from '../../services/auth-services/auth.service';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule, EmojiPickerComponent, CommonModule],
  templateUrl: './input-box.component.html',
  styleUrl: './input-box.component.scss',
})
export class InputBoxComponent implements OnChanges {
  @Input() messagePath: string = '';
  @Input() showEmojiPicker: boolean = false;
  inputData = new InputBoxData('', []);
  @Input() receiverId: string | null = null;
  @Output() messageSent = new EventEmitter<void>();
  @Input() messageToEdit: Message | null = null;

  constructor(
    private mainService: MainService,
    public firebaseService: FirebaseServicesService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messageToEdit']) {
      this.inputData.message = this.messageToEdit
        ? this.messageToEdit.value.text
        : '';
    }
  }

  sendMessage() {
    if (this.messageToEdit !== null) {
      this.messageToEdit.value.text = this.inputData.message;
      this.mainService.updateMessage(this.messageToEdit);
      this.messageToEdit = null;
    } else {
      const isDirectMessage = !!this.receiverId;
      const messagePath = isDirectMessage
        ? this.generateDirectMessagePath()
        : this.messagePath;

      this.mainService.sendMessage(
        messagePath,
        this.inputData,
        this.receiverId
      );
    }
    this.inputData = new InputBoxData('', []);
  }

  private generateDirectMessagePath(): string {
    const senderId = this.mainService.currentUserUid!;
    const receiverId = this.receiverId!;
    const chatId =
      senderId < receiverId
        ? `${senderId}_${receiverId}`
        : `${receiverId}_${senderId}`;
    const messageId = this.firebaseService.getUniqueId();
    return `directMessages/${chatId}/messages/${messageId}`;
  }

  onEmojiSelected(emoji: string) {
    this.inputData.message += ' ' + emoji;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  closeEmojiPicker() {
    this.showEmojiPicker = false;
  }
}
