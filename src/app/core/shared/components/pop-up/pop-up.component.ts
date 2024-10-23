import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pop-up',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pop-up.component.html',
  styleUrl: './pop-up.component.scss',
})
export class PopUpComponent {
  @Input() isVisible = false;
  @Input() width: string = '300px';
  @Input() height: string = '300px';
  @Input() top!: string;
  @Input() left!: string;
  @Input() right!: string;
  closePopup() {
    this.isVisible = false;
  }

  openPopup() {
    this.isVisible = true;
  }
}
