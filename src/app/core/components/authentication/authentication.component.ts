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
import { Observable } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SignupComponent } from './signup/signup.component';
import { AuthService } from '../../shared/services/auth-services/auth.service';
import { Router } from '@angular/router';
import { WorkspaceService } from '../../shared/services/workspace-service/workspace.service';
import { ResetPasswordLinkComponent } from './reset-password-link/reset-password-link.component';

@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    SignupComponent,
    ChooseAvatarComponent,
    ResetPasswordComponent,
    ResetPasswordLinkComponent,
  ],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
  providers: [JsonPipe],
})
export class AuthenticationComponent implements OnInit, AfterViewInit {
  @ViewChild(SignupComponent, { static: true })
  signupComponent!: SignupComponent;
  currentUser: any;
  users: Observable<any[]>;

  removeLoginAnimation = false;
  removeAnimationText = false;

  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService,
    private authService: AuthService,
    private renderer: Renderer2,
    private router: Router,
    public workspaceService: WorkspaceService
  ) {
    this.users = this.firebaseService.getUsers();
    this.getCurrentUser();
  }

  @ViewChild('logoContainer') logoContainer!: ElementRef;
  @ViewChild('logoImage') logoImage!: ElementRef;
  @ViewChild('logoText') logoText!: ElementRef;
  @ViewChild('mainLogo') mainLogo!: ElementRef;
  @ViewChild('backgroundFade') backgroundFade!: ElementRef;

  // ngOnInit(): void {
  //   console.log('daten:', this.users);
  //   console.log('test');
  // }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      this.currentUser = user;
    });

    setTimeout(() => {
      this.removeLoginAnimation = true;
    }, 2600);
  }

  getCurrentUser(): void {
    console.log('Getting current user...');
    this.authService.getCurrentUser().subscribe((user) => {
      console.log('Current user:', user);
      this.currentUser = user;
    });
  }

  ngAfterViewInit(): void {
    this.renderer.removeClass(this.mainLogo.nativeElement, 'd-none');

    setTimeout(() => {
      this.renderer.addClass(
        this.logoContainer.nativeElement,
        'move-to-target'
      );
      this.renderer.addClass(this.backgroundFade.nativeElement, 'opacity-fade');
    }, 2000);

    setTimeout(() => {
      this.renderer.removeClass(this.logoText.nativeElement, 'd-none');
      this.renderer.addClass(this.logoText.nativeElement, 'text-slide-in');
    }, 900);

    setTimeout(() => {
      this.renderer.addClass(this.logoImage.nativeElement, 'move-left-target');
    }, 500);
  }
}
