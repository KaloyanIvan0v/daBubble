import { Component } from '@angular/core';
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
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent {}
