import { Component, Input } from '@angular/core';
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
export class InputBoxComponent {
  @Input() channelId: string = '';
  inputData = new InputBoxData('', []);

  constructor(private mainService: MainService) {}

  sendMessage() {
    this.mainService.sendMessage('channels', this.channelId, this.inputData);
    this.inputData = new InputBoxData('', []);
  }
}
