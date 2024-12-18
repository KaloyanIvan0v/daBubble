import { Component } from '@angular/core';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChannelListComponent } from './channel-list/channel-list.component';
import { Router } from '@angular/router';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';
import { SearchInputComponent } from 'src/app/core/shared/components/search-input/search-input.component';
@Component({
  selector: 'app-left-side-component',
  standalone: true,
  imports: [ChannelListComponent, ChatListComponent, SearchInputComponent],
  templateUrl: './left-side-component.component.html',
  styleUrl: './left-side-component.component.scss',
})
export class LeftSideComponentComponent {
  constructor(
    private router: Router,
    public workspaceService: WorkspaceService,
    private statefulWindowService: StatefulWindowServiceService
  ) {}
  navigateToNewChat() {
    this.router.navigate(['dashboard', 'new-chat']);
  }

  openNewChat() {
    this.navigateToNewChat();
    this.workspaceService.currentActiveUnitId.set('newMessage');

    if (window.innerWidth < 960) {
      this.statefulWindowService.openChatOnMobile();
    }
  }
}
