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
import { NavigationEnd, Router } from '@angular/router';

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
  isBelow960: boolean = false;
  showDevSpaceOnMobile: boolean = false;

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService,
    public cdRef: ChangeDetectorRef,
    public searchService: SearchService,
    private router: Router
  ) {
    this.userData$ = this.workspaceService.loggedInUserData;
  }

  ngOnInit(): void {
    this.updateView(window.innerWidth);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateLogoBasedOnRouteAndScreenSize(event.url);
      }
    });
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
    this.updateView(event.target.innerWidth);
  }

  updateView(screenWidth: number): void {
    this.isBelow960 = screenWidth <= 960;
    this.updateLogoBasedOnRouteAndScreenSize(this.router.url);
  }

  updateLogoBasedOnRouteAndScreenSize(url: string): void {
    if (this.isBelow960) {
      if (url.includes('/channel-chat')) {
        this.logoSrc = 'assets/img/workspace-logo.svg';
        this.showDevSpaceOnMobile = true;
      } else if (url.includes('/direct-chat')) {
        this.logoSrc = 'assets/img/workspace-logo.svg';
        this.showDevSpaceOnMobile = true;
      } else if (url.includes('/new-chat')) {
        this.logoSrc = 'assets/img/workspace-logo.svg';
        this.showDevSpaceOnMobile = true;
      } else {
        this.logoSrc = 'assets/img/logo-long.svg';
        this.showDevSpaceOnMobile = false;
      }
    } else {
      this.logoSrc = 'assets/img/logo-long.svg';
      this.showDevSpaceOnMobile = false;
    }
  }

  openPopUp() {
    this.workspaceService.userMenuPopUp.set(true);
  }
}
