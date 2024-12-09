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
  users: Observable<any[]>;

  removeLoginAnimation = false;
  removeAnimationText = false;

  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService,
    private renderer: Renderer2,
    public workspaceService: WorkspaceService
  ) {
    this.users = this.firebaseService.getUsers();
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
    setTimeout(() => {
      this.removeLoginAnimation = true;
    }, 2700);
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
}
