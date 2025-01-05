import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { filter, Observable } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { SignupComponent } from './signup/signup.component';
import { WorkspaceService } from '../../shared/services/workspace-service/workspace.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
  providers: [JsonPipe],
})
export class AuthenticationComponent implements OnInit, AfterViewInit {
  @ViewChild(SignupComponent, { static: true })
  signupComponent!: SignupComponent;
  users: Observable<any[]>;
  removeLoginAnimation = false;
  removeAnimationText = false;
  currentModeClass: string = 'login-mode';
  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService,
    private renderer: Renderer2,
    public workspaceService: WorkspaceService,
    public router: Router,
    public activatedRoute: ActivatedRoute
  ) {
    this.users = this.firebaseService.getUsers();
  }

  @ViewChild('logoContainer') logoContainer!: ElementRef;
  @ViewChild('logoImage') logoImage!: ElementRef;
  @ViewChild('logoText') logoText!: ElementRef;
  @ViewChild('mainLogo') mainLogo!: ElementRef;
  @ViewChild('backgroundFade') backgroundFade!: ElementRef;

  ngOnInit(): void {
    this.removeLoginAnimationAfterDelay();
    this.setInitialModeClass();
    this.subscribeToRouteChanges();
  }

  private removeLoginAnimationAfterDelay(): void {
    setTimeout(() => {
      this.removeLoginAnimation = true;
    }, 2700);
  }

  /**
   * Sets the initial mode class based on the deepest child route's data.
   *
   * The mode class is determined by the value of the 'modeClass' property in
   * the deepest child route's snapshot data. If the property is not present
   * or null, the default mode class of 'login-mode' is used.
   */
  private setInitialModeClass(): void {
    const childRoute = this.getDeepestChildRoute(this.activatedRoute);
    const modeClass = childRoute?.snapshot.data['modeClass'];
    this.currentModeClass = modeClass || 'login-mode';
  }

  /**
   * Subscribes to route changes and updates the current mode class accordingly.
   *
   * Whenever a route change occurs, it gets the deepest child route and
   * checks if it has a 'modeClass' property in its snapshot data.
   * If yes, it updates the current mode class to that value.
   * If not, it falls back to 'login-mode'.
   */
  private subscribeToRouteChanges(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const nestedChildRoute = this.getDeepestChildRoute(this.activatedRoute);
        const newModeClass = nestedChildRoute?.snapshot.data['modeClass'];
        this.currentModeClass = newModeClass || 'login-mode';
      });
  }

  /**
   * Recursively finds the deepest child route for the given activated route.
   *
   * @param route - The starting activated route from which the search begins.
   * @returns The deepest child route if it exists; otherwise, null.
   */

  private getDeepestChildRoute(route: ActivatedRoute): ActivatedRoute | null {
    let childRoute = route.firstChild;
    while (childRoute?.firstChild) {
      childRoute = childRoute.firstChild;
    }
    return childRoute;
  }

  ngAfterViewInit(): void {
    this.startAnimationSequence();
  }

  /**
   * Starts the animation sequence for the logo, background fade, and main
   * logo components when the component is initialized.
   *
   * The animation sequence consists of the following steps:
   *
   * 1. The logo image slides to the left after 500 milliseconds.
   * 2. The logo text appears and slides to the left after 900 milliseconds.
   * 3. The logo container slides to the top of the screen if the screen width
   *    is less than or equal to 650 pixels or to its target position otherwise
   *    after 2000 milliseconds.
   * 4. The background fade animation starts after 2000 milliseconds.
   * 5. The main logo appears after 2600 milliseconds.
   */
  private startAnimationSequence(): void {
    const screenWidth = window.innerWidth;

    setTimeout(() => {
      this.renderer.addClass(this.logoImage.nativeElement, 'move-left-target');
    }, 500);

    setTimeout(() => {
      this.renderer.removeClass(this.logoText.nativeElement, 'd-none');
      this.renderer.addClass(this.logoText.nativeElement, 'text-slide-in');
    }, 900);

    setTimeout(() => {
      if (screenWidth <= 650) {
        this.renderer.addClass(this.logoContainer.nativeElement, 'move-to-top');
      } else {
        this.renderer.addClass(
          this.logoContainer.nativeElement,
          'move-to-target'
        );
      }

      this.renderer.addClass(this.backgroundFade.nativeElement, 'opacity-fade');
    }, 2000);

    setTimeout(() => {
      this.renderer.removeClass(this.mainLogo.nativeElement, 'd-none');
    }, 2600);
  }

  navigateToSignup() {
    this.router.navigate(['signup'], { relativeTo: this.activatedRoute });
  }

  navigateToLogin() {
    this.router.navigate(['login'], { relativeTo: this.activatedRoute });
  }

  navigateToAvatarSelection() {
    this.router.navigate(['choose-avatar'], {
      relativeTo: this.activatedRoute,
    });
  }

  navigateToResetPassword() {
    this.router.navigate(['reset-password'], {
      relativeTo: this.activatedRoute,
    });
  }
}
