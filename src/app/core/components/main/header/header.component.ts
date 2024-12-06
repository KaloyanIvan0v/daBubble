import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { Observable } from 'rxjs';
import { SearchService } from 'src/app/core/shared/services/search-service/search.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  userData$: Observable<any>;

  loggedInUserId: string | null = null;

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public cdRef: ChangeDetectorRef,
    public searchService: SearchService
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  @ViewChild('searchInput', { static: false }) searchContainer!: ElementRef;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (
      this.searchContainer &&
      !this.searchContainer.nativeElement.contains(event.target)
    ) {
      this.searchService.headerSearchResults = [];
    }
  }

  openPopUp() {
    this.workspaceService.userMenuPopUp.set(true);
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const queryText = input.value;
    if (queryText.trim()) {
      this.firebaseService
        .searchAllChannelsAndUsers(queryText)
        .subscribe((results) => {
          this.searchService.headerSearchResults =
            this.searchService.filterOutLoggedInUser(results);
        });
    } else {
      this.searchService.headerSearchResults = [];
    }
  }
}
