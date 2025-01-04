import { StatefulWindowServiceService } from 'src/app/core/shared/services/stateful-window-service/stateful-window-service.service';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  effect,
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
  logoSrc: string = 'assets/img/logo-long.svg';
  showDevSpaceOnMobile: boolean = false;

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public cdRef: ChangeDetectorRef,
    public searchService: SearchService,
    public statefulWindowService: StatefulWindowServiceService
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;

    effect(() => {
      const mode = this.statefulWindowService.currentActiveComponentMobile();
      this.updateLogoBasedOnMobileMode(mode);
    });
  }

  ngOnInit(): void {
    this.statefulWindowService.updateView(window.innerWidth);
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

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.statefulWindowService.updateView(event.target.innerWidth);
  }

  updateLogoBasedOnMobileMode(mode: 'left' | 'chat' | 'thread'): void {
    if (this.statefulWindowService.isBelow960) {
      switch (mode) {
        case 'left':
          this.logoSrc = 'assets/img/logo-long.svg';
          this.showDevSpaceOnMobile = false;
          break;
        default:
          this.logoSrc = 'assets/img/workspace-logo.svg';
          this.showDevSpaceOnMobile = true;
      }
    } else {
      this.logoSrc = 'assets/img/logo-long.svg';
      this.showDevSpaceOnMobile = false;
    }
  }

  openPopUp() {
    if (window.innerWidth > 960) {
      this.workspaceService.userMenuPopUp.set(true);
      this.workspaceService.mobileUserMenuPopUp.set(false);
    } else {
      this.workspaceService.mobileUserMenuPopUp.set(true);
      this.workspaceService.userMenuPopUp.set(false);
    }

    // Trigger Angular's change detection
    this.cdRef.detectChanges();

    // Log the state after ensuring the value is updated
    console.log(
      'MobileUserMenu visibility:',
      this.workspaceService.mobileUserMenuPopUp()
    );
  }
}
