import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-workspace',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './main-workspace.component.html',
  styleUrls: ['./main-workspace.component.scss'],
})
export class MainWorkspaceComponent {}
