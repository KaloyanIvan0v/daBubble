import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { Subscription } from 'rxjs';
import { Channel } from 'src/app/core/shared/models/channel.class';
import { AddUserToChannelComponent } from 'src/app/core/shared/components/pop-ups/add-user-to-channel/add-user-to-channel.component';
import { ChannelMembersViewComponent } from 'src/app/core/shared/components/pop-ups/channel-members-view/channel-members-view.component';
import { EditChannelComponent } from 'src/app/core/shared/components/pop-ups/edit-channel/edit-channel.component';
import { MessageComponent } from 'src/app/core/shared/components/message/message.component';
@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [
    InputBoxComponent,
    AddUserToChannelComponent,
    ChannelMembersViewComponent,
    EditChannelComponent,
    FormsModule,
    CommonModule,
    MessageComponent,
  ],
  templateUrl: './channel-chat.component.html',
  styleUrls: ['./channel-chat.component.scss'],
})
export class ChannelChatComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  private subscriptions = new Subscription();
  private channelSubscription?: Subscription;
  channelData!: Channel;
  channelName: string = '';
  channelId: string = '';
  userAmount: number = 0;
  channelUsers: any[] = [];
  popUpStates: { [key: string]: boolean } = {};
  private popUpStatesSubscription!: Subscription;

  constructor(
    private workspaceService: WorkspaceService,
    private firebaseService: FirebaseServicesService
  ) {
    effect(() => {
      this.channelId = this.workspaceService.currentActiveUnitId();
      if (this.channelId) {
        this.loadChannelData(this.channelId);
      } else {
        console.warn('Keine gültige channelId verfügbar.');
      }
    });
  }

  ngOnInit(): void {}

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  // Methode, um immer nach unten zu scrollen
  private scrollToBottom(): void {
    if (this.messageContainer) {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    }
  }
  // Automatisches Scrollen nach neuen Änderungen
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private loadChannelData(channelId: string): void {
    this.channelSubscription?.unsubscribe();

    this.channelUsers = [];
    this.channelSubscription = this.firebaseService
      .getChannel(channelId)
      .subscribe({
        next: (channel) => {
          if (channel) {
            this.channelData = channel;
            this.channelName = channel.name;
            this.userAmount = channel.uid.length;
            this.loadUsers();
          }
        },
        error: (error) =>
          console.error('Fehler beim Laden des Channels:', error),
      });
  }
  async loadUsers() {
    const channelUids = this.channelData.uid;
    const userPromises = channelUids.map((uid) =>
      this.firebaseService.getDocOnce('users', uid)
    );
    const users = await Promise.all(userPromises);
    this.channelUsers = users.filter((user) => user != null);
  }

  ngOnDestroy(): void {
    this.channelSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
    this.popUpStatesSubscription?.unsubscribe();
  }

  openEditChannelPopUp() {
    this.workspaceService.editChannelPopUp.set(true);
  }

  openAddUserToChannelPopUp() {
    this.workspaceService.addUserToChannelPopUp.set(true);
  }

  openChannelUsersViewPopUp() {
    this.workspaceService.channelMembersPopUp.set(true);
  }
}
