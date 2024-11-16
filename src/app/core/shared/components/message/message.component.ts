import { Component, Input } from '@angular/core';
import { Message } from 'src/app/core/shared/models/message.class';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  @Input() message!: Message;

  constructor() {}

  ngOnInit() {}
}
