import { Message } from 'src/app/core/shared/models/message.class';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { InputBoxData } from 'src/app/core/shared/models/input.class';
import { FormsModule } from '@angular/forms';
import { MainService } from 'src/app/core/components/main/main.service';

@Component({
  selector: 'app-input-box',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './input-box.component.html',
  styleUrl: './input-box.component.scss',
})
export class InputBoxComponent implements OnChanges {
  @Input() channelId: string = '';
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
      this.mainService.sendMessage('channels', this.channelId, this.inputData);
    }
    this.inputData = new InputBoxData('', []);
  }
}
