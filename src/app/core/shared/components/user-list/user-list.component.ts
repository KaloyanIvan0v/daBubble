import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { User } from 'src/app/core/shared/models/user.class';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnChanges, OnDestroy, OnInit {
  @Input() usersUid: string[] = [];
  @Input() showEmail: boolean = false;
  @Output() selectedUser = new EventEmitter<User>();

  currentUserUid: string | null = null;
  users: User[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private firebaseService: FirebaseServicesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeCurrentUser();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.usersUid) return;
    if (changes['usersUid'] && this.usersUid.length > 0) {
      this.loadUsersByUids(this.usersUid);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  /**
   * Emits the selected user through the EventEmitter.
   * @param {User} user - The user to be selected.
   */
  returnUser(user: User): void {
    this.selectedUser.emit(user);
  }

  /**
   * Initializes the current logged-in user's UID.
   */
  private async initializeCurrentUser(): Promise<void> {
    try {
      this.currentUserUid = await this.authService.getCurrentUserUID();
    } catch (error) {
      this.handleError('Error fetching current user UID:', error);
    }
  }

  /**
   * Loads users based on an array of UIDs.
   * @param {string[]} uids - An array of user UIDs.
   */
  private async loadUsersByUids(uids: string[]): Promise<void> {
    try {
      this.users = await this.fetchUsersByUids(uids);
    } catch (error) {
      this.handleError('Error fetching users by UIDs:', error);
    }
  }

  /**
   * Fetches user data for the provided UIDs.
   * @param {string[]} uids - An array of user UIDs.
   * @returns {Promise<User[]>} - A promise resolving to an array of User objects.
   */
  private async fetchUsersByUids(uids: string[]): Promise<User[]> {
    const userPromises = uids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = await Promise.all(userPromises);
    return users.filter((user) => user !== null) as User[];
  }

  /**
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  private unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Handles errors by logging them to the console.
   * @param {string} message - The error message to log.
   * @param {any} error - The error object.
   */
  private handleError(message: string, error: any): void {
    console.error(message, error);
  }
}
