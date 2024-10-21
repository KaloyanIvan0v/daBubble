import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainWorkspaceComponent } from './main-workspace/main-workspace.component';
import { LeftSideComponentComponent } from './left-side-component/left-side-component.component';
import { RightSideContainerComponent } from './right-side-container/right-side-container.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    MainWorkspaceComponent,
    LeftSideComponentComponent,
    RightSideContainerComponent,
    HeaderComponent,
    CommonModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {
  workSpaceOpen: boolean = false;
  workspaceButtonText: string = 'Workspace-Menu schließen';

  toggleWorkspace() {
    this.workSpaceOpen = !this.workSpaceOpen;
  }

  changeText() {
    if (this.workSpaceOpen) {
      this.workspaceButtonText = 'Workspace-Menu öffnen';
    } else {
      this.workspaceButtonText = 'Workspace-Menu schließen';
    }
  }
}
