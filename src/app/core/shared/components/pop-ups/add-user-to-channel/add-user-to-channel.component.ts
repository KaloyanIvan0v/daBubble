import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GlobalDataService } from '../../../services/pop-up-service/global-data.service';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { User } from 'src/app/core/shared/models/user.class';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-user-to-channel.component.html',
  styleUrl: './add-user-to-channel.component.scss',
})
export class AddUserToChannelComponent {
  currentChannelId: string;
  channelData$!: Observable<Channel>;
  searchText: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = [];

  constructor(
    public globalDataService: GlobalDataService,
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService
  ) {
    this.currentChannelId = this.workspaceService.currentActiveUnitId();
    this.channelData$ = this.firebaseService.getChannel(this.currentChannelId);
    this.firebaseService.getUsers().subscribe((users) => {
      this.users = users;
    });
  }

  closePopUp() {
    this.globalDataService.closePopUp();
  }

  addUsers() {
    this.globalDataService.closePopUp();
  }

  addUserChip(user: User) {
    this.selectedUsers.push(user);
  }

  removeUserChip(user: User) {
    const index = this.selectedUsers.indexOf(user);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  filterUsers() {
    this.filteredUsers = this.users.filter((user) =>
      user.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  onSearchTextChange() {
    this.filterUsers();
  }
}
