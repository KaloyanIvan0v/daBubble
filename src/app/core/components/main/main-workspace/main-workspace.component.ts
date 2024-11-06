import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-workspace',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './main-workspace.component.html',
  styleUrls: ['./main-workspace.component.scss'],
})
export class MainWorkspaceComponent {}
