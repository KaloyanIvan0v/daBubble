import { Component } from '@angular/core';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [InputBoxComponent],
  templateUrl: './new-chat.component.html',
  styleUrl: './new-chat.component.scss',
})
export class NewChatComponent {}
