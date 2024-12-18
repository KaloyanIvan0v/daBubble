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
import { SearchInputComponent } from 'src/app/core/shared/components/search-input/search-input.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SearchInputComponent],
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

  @ViewChild('searchArea', { static: false, read: ElementRef })
  searchArea!: ElementRef;
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (
      this.searchArea &&
      !this.searchArea.nativeElement.contains(event.target)
    ) {
      this.searchService.headerSearchResults = [];
    }
  }

  openPopUp() {
    this.workspaceService.userMenuPopUp.set(true);
  }
}
