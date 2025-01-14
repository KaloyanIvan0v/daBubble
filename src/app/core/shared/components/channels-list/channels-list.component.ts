import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/shared/services/auth-services/auth.service';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';
import { WorkspaceService } from 'src/app/core/shared/services/workspace-service/workspace.service';
import { Channel } from '../../models/channel.class';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-channels-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './channels-list.component.html',
  styleUrls: ['./channels-list.component.scss'],
})
export class ChannelsListComponent implements OnInit, OnChanges {
  @Input() channelsInput: Channel[] = [];
  @Input() channelUids: string[] = [];
  @Output() selectedChannel = new EventEmitter<string>();

  constructor(
    public firebaseService: FirebaseServicesService,
    public workspaceService: WorkspaceService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadChannels();
  }

  async loadChannels(): Promise<void> {
    if (this.channelUids && this.channelUids.length > 0) {
      this.channelsInput = [];
      for (const uid of this.channelUids) {
        const channel$ = this.firebaseService.getChannel(uid);
        const channel = await firstValueFrom(
          channel$.pipe(filter((channelData) => channelData !== null))
        );
        if (channel) {
          this.channelsInput.push(channel);
        }
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['channelUids']) {
      this.loadChannels();
    }
  }

  returnChannelId(channelId: string): void {
    this.selectedChannel.emit(channelId);
  }
}
