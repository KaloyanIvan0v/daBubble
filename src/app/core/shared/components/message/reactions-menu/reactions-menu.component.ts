import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reactions-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reactions-menu.component.html',
  styleUrls: ['./reactions-menu.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ReactionsMenuComponent {
  selectedEmojis: string[] = [];
  showEmojiPicker = false;

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any): void {}
}
