import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';

@Component({
  selector: 'app-right-side-container',
  standalone: true,
  imports: [RouterModule, InputBoxComponent],
  templateUrl: './right-side-container.component.html',
  styleUrl: './right-side-container.component.scss',
})
export class RightSideContainerComponent {}
