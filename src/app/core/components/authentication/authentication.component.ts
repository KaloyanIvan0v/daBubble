import {
  Component,
  OnInit,
  Renderer2,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseServicesService } from '../../shared/services/firebase/firebase.service';
import { Observable } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AuthUIService } from '../../shared/services/authUI-services/authUI.service';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
@Component({
  selector: 'app-authentication',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    SignupComponent,
    ChooseAvatarComponent,
    ResetPasswordComponent,
  ],
  templateUrl: './authentication.component.html',
  styleUrl: './authentication.component.scss',
  providers: [JsonPipe],
})
export class AuthenticationComponent {
  removeLoginAnimation = false;
  removeAnimationText = false;
  constructor(
    private firebaseService: FirebaseServicesService,
    public authUIService: AuthUIService,
    private renderer: Renderer2
  ) {
    this.users = this.firebaseService.getCollection('users');
  }

  users: Observable<any[]>;
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
    this.users.subscribe((data) => {});

    setTimeout(() => {
      this.removeLoginAnimation = true;
      this.renderer.removeClass(this.mainLogo.nativeElement, 'd-none');
    }, 2600);

    setTimeout(() => {
      this.renderer.addClass(
        this.logoContainer.nativeElement,
        'move-to-target'
      );

      this.renderer.addClass(this.backgroundFade.nativeElement, 'opacity-fade');
    }, 2000);

    setTimeout(() => {
      this.renderer.removeClass(this.logoText.nativeElement, 'd-none');
    }, 900);

    setTimeout(() => {
      this.renderer.addClass(this.logoText.nativeElement, 'text-slide-in');
    }, 800);

    setTimeout(() => {
      this.renderer.addClass(this.logoImage.nativeElement, 'move-left-target');
    }, 500);
  }
}
