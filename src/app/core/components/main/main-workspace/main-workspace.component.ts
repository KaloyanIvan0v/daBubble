import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MainWorkspaceRoutes } from './main-workspace-routing';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';

@Component({
  template: ` <router-outlet></router-outlet> `,
  selector: 'app-main-workspace',
  standalone: true,
  imports: [RouterModule, InputBoxComponent],
  templateUrl: './main-workspace.component.html',
  styleUrls: ['./main-workspace.component.scss'],
})
export class MainWorkspaceComponent {}
