import { FirebaseServicesService } from './../../services/firebase/firebase.service';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from 'src/app/core/shared/models/message.class';
import { User } from '../../models/user.class';
import { Observable } from 'rxjs';
import { FirebaseTimePipe } from 'src/app/shared/pipes/firebase-time.pipe';
import { WorkspaceService } from '../../services/workspace-service/workspace.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FirebaseTimePipe],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  @Input() message!: Message;
  author$: Observable<User> = new Observable();

  constructor(
    private firebaseService: FirebaseServicesService,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.author$ = this.firebaseService.getUser(this.message.author);
  }

  openAuthorProfile(authorId: string) {
    this.workspaceService.currentActiveUserId.set(authorId);
    this.workspaceService.profileViewPopUp.set(true);
  }
}
