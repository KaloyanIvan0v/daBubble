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
        const html = `
          <div class="pipe-user-details">
            <img src="${user.photoURL}" alt="${user.name}" style="width:30px;height:30px;border-radius:50%;" />
            <span style="margin-left:8px;">${user.name}</span>
          </div>`;
        return this.sanitizer.bypassSecurityTrustHtml(html);
      })
    );
  }
}
