import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PopUpComponent } from './core/shared/components/pop-up/pop-up.component';
import { AddChannelComponent } from './core/shared/components/add-channel/add-channel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PopUpComponent, AddChannelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'daBubble';
}
