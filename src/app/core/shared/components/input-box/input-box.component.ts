import { Message } from 'src/app/core/shared/models/message.class';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { FormsModule } from '@angular/forms';
import { MainService } from 'src/app/core/shared/services/main-service/main.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';
import { UserListComponent } from '../user-list/user-list.component';
import { User } from 'src/app/core/shared/models/user.class';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule, EmojiPickerComponent, CommonModule, UserListComponent],
  templateUrl: './input-box.component.html',
  styleUrl: './input-box.component.scss',
})
export class InputBoxComponent implements OnChanges {
  @Input() messagePath: string = '';
  @Input() showEmojiPicker: boolean = false;
  @Input() receiverId: string | null = null;
  @Input() messageToEdit: Message | undefined = undefined;
  @Input() usersUid: string[] = [];

  @ViewChild('messageTextarea')
  messageTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mirrorElement') mirrorElement!: ElementRef<HTMLDivElement>;

  userListTop = 0;
  userListLeft = 0;

  inputData = new InputBoxData('', []);
  selectedUser: User | null = null;
  showUserList: boolean = false;
  showUserListTextArea: boolean = false;

  constructor(private mainService: MainService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messageToEdit']) {
      this.inputData.message = this.messageToEdit
        ? this.messageToEdit.value.text
        : '';
    }
    if (changes['selectedUser']) {
      console.log(this.selectedUser);
    }
  }

  sendMessage() {
    if (this.messageToEdit !== undefined) {
      this.messageToEdit.value.text = this.inputData.message;
      this.mainService.updateMessage(this.messageToEdit);
      this.messageToEdit = undefined;
    } else {
      this.mainService.sendMessage(
        this.messagePath,
        this.inputData,
        this.receiverId
      );
    }
    this.inputData = new InputBoxData('', []);
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

  showAvailableUsers() {
    this.showUserList = !this.showUserList;
  }

  closeUserList() {
    setTimeout(() => {
      this.showUserList = false;
    }, 25);
  }

  onMessageChange() {
    this.checkForMentionSign();
  }

  returnUser(user: User) {
    this.addMentionedUser(user);
  }

  addMentionedUser(user: User) {
    const textarea = this.messageTextarea.nativeElement;
    const message = this.inputData.message;
    const cursorPos = textarea.selectionStart; // aktuelle Cursor-Position

    // Prüfen, ob vor dem Cursor ein '@' ist und cursorPos > 0, damit wir nicht außerhalb des Strings zugreifen
    if (cursorPos > 0 && message[cursorPos - 1] === '@') {
      // Entferne das '@' am Cursor und ersetze es durch '@Benutzername'
      this.inputData.message =
        message.slice(0, cursorPos - 1) +
        '@' +
        user.name +
        ' ' +
        message.slice(cursorPos);
    } else {
      // Falls kein '@' vor dem Cursor steht, wie gewohnt einfügen
      this.inputData.message += ` @${user.name} `;
    }

    this.closeUserList();
    this.setCursorToEnd();
  }

  setCursorToEnd() {
    const textarea = document.querySelector('textarea');
    textarea?.focus();
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  checkForMentionSign() {
    const textarea = this.messageTextarea.nativeElement; // Annahme: per ViewChild referenziert
    const message = this.inputData.message;

    // Ermittele die aktuelle Cursor-Position
    const cursorPos = textarea.selectionStart;

    // Stelle sicher, dass es eine vorherige Position gibt
    if (cursorPos > 0) {
      // Prüfe, ob das Zeichen vor der Cursor-Position ein '@' ist
      if (message[cursorPos - 1] === '@') {
        console.log('@ found before cursor at', cursorPos - 1);
        this.positionUserList(cursorPos - 1);
      } else {
        this.showUserListTextArea = false;
      }
    } else {
      // Cursor ist ganz am Anfang, also gibt es kein Zeichen davor
      this.showUserListTextArea = false;
    }
  }

  positionUserList(atIndex: number) {
    const textarea = this.messageTextarea.nativeElement;
    const mirror = this.mirrorElement.nativeElement;

    // Inhalt bis @ in Mirror schreiben
    // Styles (Font, Padding, Border etc.) vorher so anpassen, dass sie exakt zur Textarea passen!
    mirror.textContent = textarea.value.substring(0, atIndex);

    // Jetzt fügen wir ein Markierungselement ein, um Position des @ genau zu ermitteln
    const marker = document.createElement('span');
    marker.textContent = '@';
    marker.style.backgroundColor = 'yellow'; // nur zum Testen, später entfernen
    mirror.appendChild(marker);

    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    const containerRect = textarea.parentElement?.getBoundingClientRect();
    if (containerRect) {
      this.userListTop = markerRect.top - containerRect.top - 300;
      this.userListLeft = markerRect.left - containerRect.left;
    } else {
      // Handle the case where containerRect is null or undefined
      console.error('containerRect is null or undefined');
    }

    this.showUserListTextArea = true;
  }
}
