import {
  Component,
  Renderer2,
  ViewChildren,
  QueryList,
  ElementRef,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../services/workspace-service/workspace.service';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { User } from 'src/app/core/shared/models/user.class';
import { FirebaseServicesService } from '../../../services/firebase/firebase.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-user-to-channel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-user-to-channel.component.html',
  styleUrls: ['./add-user-to-channel.component.scss'],
})
export class AddUserToChannelComponent implements OnDestroy {
  currentChannelId: string;
  channelData$!: Observable<Channel>;
  channelData!: Channel;
  searchText: string = '';
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    public workspaceService: WorkspaceService,
    public firebaseService: FirebaseServicesService,
    private renderer: Renderer2
  ) {
    this.currentChannelId = this.workspaceService.currentActiveUnitId();
    this.initializeUsers();
    this.initializeChannelData();
  }

  private initializeUsers() {
    this.firebaseService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
      });
  }

  private initializeChannelData() {
    effect(() => {
      this.currentChannelId = this.workspaceService.currentActiveUnitId();
      this.channelData$ = this.firebaseService.getChannel(
        this.currentChannelId
      );
      this.channelData$.pipe(takeUntil(this.destroy$)).subscribe((channel) => {
        this.channelData = channel;
      });
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
    this.closePopUp();
    const newUids = this.getSelectedUserUids();
    this.updateChannelUserIds(newUids);
    this.clearSelectedUsers();
  }

  private getSelectedUserUids(): string[] {
    return this.selectedUsers.map((user) => user.uid);
  }

  private updateChannelUserIds(newUids: string[]) {
    this.channelData.uid = [...new Set([...this.channelData.uid, ...newUids])];
    this.firebaseService.updateDoc('channels', this.currentChannelId, {
      uid: this.channelData.uid,
    });
  }

  private clearSelectedUsers() {
    this.selectedUsers = [];
  }

  addUserChip(user: User) {
    if (!this.isUserAlreadySelected(user)) {
      this.addUserToSelected(user);
    } else {
      this.animateExistingUserChip(user);
    }
  }

  private isUserAlreadySelected(user: User): boolean {
    return this.selectedUsers.some(
      (existingUser) => existingUser.uid === user.uid
    );
  }

  private addUserToSelected(user: User) {
    this.selectedUsers.push(user);
    this.searchText = '';
  }

  private animateExistingUserChip(user: User) {
    const userChip = this.findUserChipById(user.uid);
    if (userChip) {
      this.renderer.addClass(userChip.nativeElement, 'shake-div');
      setTimeout(() => {
        this.renderer.removeClass(userChip.nativeElement, 'shake-div');
      }, 300);
    }
  }

  private findUserChipById(uid: string): ElementRef | undefined {
    return this.userChips.find((chip) => chip.nativeElement.id === uid);
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
