import {
  Component,
  Renderer2,
  ViewChildren,
  QueryList,
  ElementRef,
  Input,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { User } from 'src/app/core/shared/models/user.class';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Observable } from 'rxjs';
import { AddChannelComponent } from '../add-channel/add-channel.component';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [FormsModule, CommonModule, AddChannelComponent],
  templateUrl: './add-user-to-channel.component.html',
  styleUrl: './add-user-to-channel.component.scss',
})
export class AddUserToChannelComponent {
  currentChannelId: string;
  channelData$!: Observable<Channel>;
  channelData!: Channel;
  searchText: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = [];

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private renderer: Renderer2
  ) {
    this.currentChannelId = this.workspaceService.currentActiveUnitId();
    this.channelData$ = this.firebaseService.getChannel(this.currentChannelId);
    this.firebaseService.getUsers().subscribe((users) => {
      this.users = users;
    });
    this.channelData$.subscribe((channel) => {
      this.channelData = channel;
    });
  }

  @ViewChildren('userChip') userChips!: QueryList<ElementRef>;

  get popUpVisible() {
    return this.workspaceService.addUserToChannelPopUp();
  }

  closePopUp() {
    this.workspaceService.addUserToChannelPopUp.set(false);
  }

  addUsers() {
    const newUids = this.selectedUsers.map((user) => user.uid);
    this.channelData.uid = [...new Set([...this.channelData.uid, ...newUids])];
    this.firebaseService.updateDoc('channels', this.currentChannelId, {
      uid: this.channelData.uid,
    });
  }

  addUserChip(user: any) {
    const userExists = this.selectedUsers.some(
      (existingUser) => existingUser.uid === user.uid
    );

    if (!userExists) {
      this.selectedUsers.push(user);
      this.searchText = '';
    } else {
      console.log('User already exists');
      const userChip = this.userChips.find(
        (chip) => chip.nativeElement.id === user.uid
      );

      if (userChip) {
        this.renderer.addClass(userChip.nativeElement, 'shake-div');
        setTimeout(() => {
          this.renderer.removeClass(userChip.nativeElement, 'shake-div');
        }, 300);
      }
    }
  }

  removeUserChip(user: User) {
    const index = this.selectedUsers.indexOf(user);
    if (index !== -1) {
      this.selectedUsers.splice(index, 1);
    }
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(
      (user) =>
        user.name.toLowerCase().includes(this.searchText.toLowerCase()) &&
        !this.channelData.uid.includes(user.uid)
    );
  }

  onSearchTextChange() {
    this.filterUsers();
  }
}
