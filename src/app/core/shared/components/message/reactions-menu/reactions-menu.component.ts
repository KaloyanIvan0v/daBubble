import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiPickerComponent } from '../../emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-reactions-menu',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent],
  templateUrl: './reactions-menu.component.html',
  styleUrls: ['./reactions-menu.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReactionsMenuComponent {
  showEmojiPicker = false;
  selectedEmojis: string[] = [];

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  onEmojiSelected(emoji: string) {
    this.selectedEmojis.push(emoji);
    this.showEmojiPicker = false;
  }

  ngOnDestroy(): void {
    this.showEmojiPicker = false;
  }
}
