import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Subscription } from 'rxjs';
import { User } from 'src/app/core/shared/models/user.class';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnChanges {
  currentUserUid: string | null = null;
  @Input() usersUid: string[] = [];
  @Input() showEmail: boolean = false;
  @Output() selectedUser = new EventEmitter<User>();
  private subscriptions: Subscription[] = [];
  users: User[] = [];

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public AuthService: AuthService
  ) {
    this.setLoggedInUserUid();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['usersUid']) {
      this.fetchUsersByUids(this.usersUid).then((users) => {
        this.users = users;
      });
    }
  }

  returnUser(user: User) {
    this.selectedUser.emit(user);
  }

  private unsubscribeAll() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async setLoggedInUserUid() {
    this.currentUserUid = await this.AuthService.getCurrentUserUID();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private async fetchUsersByUids(uids: string[]): Promise<any[]> {
    const users: any[] = [];
    for (const uid of uids) {
      const user = await this.firebaseService.getDocOnce('users', uid);
      if (user) {
        users.push(user);
      }
    }
    return users;
  }
}
