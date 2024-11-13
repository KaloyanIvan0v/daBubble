import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Subscription, Observable } from 'rxjs';
import { authState, User } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  userData$: Observable<any>;
  private userSubscription!: Subscription;
  currentUser!: User | null;

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    private cdRef: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.cdRef.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  openPopUp() {
    this.workspaceService.userMenuPopUp.set(true);
  }
}
