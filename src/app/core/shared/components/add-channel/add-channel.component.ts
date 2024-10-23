import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopUpComponent } from '../pop-up/pop-up.component';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, PopUpComponent],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {}
