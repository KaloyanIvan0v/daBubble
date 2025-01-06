import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { User } from 'src/app/core/shared/models/user.class';

@Pipe({
  name: 'showUser',
  standalone: true,
})
export class ShowUserPipe implements PipeTransform {
  private firebase = inject(FirebaseServicesService);
  private sanitizer = inject(DomSanitizer);

  transform(uid: string): Observable<SafeHtml> {
    return this.firebase.getUser(uid).pipe(
      map((user: User) => {
        console.log('User:', user);

        const imageUrl =
          user && user.photoURL && user.photoURL.trim() !== ''
            ? user.photoURL
            : 'assets/img/profile-img/profile-img-placeholder.svg';

        const userName = user && user.name ? user.name : 'unknown user';

        const html = `
          <div class="pipe-user-details">
            <img
              src="${imageUrl}"
              alt="${userName}"
              style="width:30px; height:30px; border-radius:50%;"
            />
            <span style="margin-left:8px;">${userName}</span>
          </div>
        `;
        return this.sanitizer.bypassSecurityTrustHtml(html);
      })
    );
  }
}
