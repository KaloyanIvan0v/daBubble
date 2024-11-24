import { Message } from 'src/app/core/shared/models/message.class';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { FormsModule } from '@angular/forms';
import { MainService } from 'src/app/core/components/main/main.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';

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

  @Input() messageToEdit: Message | null = null;

  constructor(private mainService: MainService) {}

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
      this.mainService.sendMessage(this.messagePath, this.inputData);
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
}
