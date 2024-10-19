import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainWorkspaceRoutes } from './main-workspace-routing';

@Component({
  template: ` <router-outlet></router-outlet> `,
  selector: 'app-main-workspace',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './main-workspace.component.html',
  styleUrls: ['./main-workspace.component.scss'],
})
export class MainWorkspaceComponent {}
