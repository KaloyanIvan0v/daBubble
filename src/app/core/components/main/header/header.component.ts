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

  /**
   * When the component is initialized, update the window width with the
   * stateful window service. This is necessary to ensure the correct
   * display of the mobile mode.
   */
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

  /**
   * Updates the state of left and right side components based on the window size
   * @param event the window resize event
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.statefulWindowService.updateView(event.target.innerWidth);
  }

  /**
   * Updates the logo source and visibility of the "DevSpace" text based on the current mobile view mode.
   *
   * @param mode - The current active component mode on mobile, which can be 'left', 'chat', or 'thread'.
   *
   * If the view is below 960 pixels, the logo and DevSpace visibility are updated according to the mode:
   * - 'left' mode sets the logo to the long version and hides the "DevSpace" text.
   * - Other modes set the logo to the workspace version and display the "DevSpace" text.
   *
   * If the view is above 960 pixels, the logo is set to the long version and the "DevSpace" text is hidden.
   */
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

  /**
   * Opens the user menu popup based on the current window size.
   *
   * If the window is above 960px, the desktop user menu popup is opened.
   * If the window is below 960px, the mobile user menu popup is opened.
   *
   * @remarks
   * Detects changes with the change detector ref to ensure the popup is
   * properly displayed.
   */
  openPopUp() {
    if (window.innerWidth > 960) {
      this.workspaceService.userMenuPopUp.set(true);
      this.workspaceService.mobileUserMenuPopUp.set(false);
    } else {
      this.workspaceService.mobileUserMenuPopUp.set(true);
      this.workspaceService.userMenuPopUp.set(false);
    }
    this.cdRef.detectChanges();
  }
}
