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
  isSignupRoute: boolean = false;
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

  private setInitialModeClass(): void {
    const childRoute = this.getDeepestChildRoute(this.activatedRoute);
    const modeClass = childRoute?.snapshot.data['modeClass'];
    this.currentModeClass = modeClass || 'login-mode';
    this.isSignupRoute = this.currentModeClass === 'signup-mode';
  }

  private subscribeToRouteChanges(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const nestedChildRoute = this.getDeepestChildRoute(this.activatedRoute);
        const newModeClass = nestedChildRoute?.snapshot.data['modeClass'];
        this.currentModeClass = newModeClass || 'login-mode';
        this.isSignupRoute = this.currentModeClass === 'signup-mode';
      });
  }

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
