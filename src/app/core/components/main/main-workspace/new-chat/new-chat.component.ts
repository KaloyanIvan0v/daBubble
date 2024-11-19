import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputBoxComponent } from 'src/app/core/shared/components/input-box/input-box.component';
import { FirebaseServicesService } from 'src/app/core/shared/services/firebase/firebase.service';

@Component({
  selector: 'app-new-chat',
  standalone: true,
  imports: [InputBoxComponent, FormsModule, CommonModule],
  templateUrl: './new-chat.component.html',
  styleUrl: './new-chat.component.scss',
})
export class NewChatComponent {
  searchQuery: string = ''; // This will bind to the input field
  searchResults: any[] = [];
  searchText: string = '';
  isSearching: boolean = false;

  constructor(private firebaseService: FirebaseServicesService) {}

  onSearchChange(): void {
    const searchText = this.searchQuery.trim();

    if (searchText) {
      if (searchText.startsWith('@')) {
        this.searchResults = [];
        this.searchForUsers(searchText);
      } else if (searchText.startsWith('#')) {
        this.searchResults = [];
        this.searchForChannels(searchText);
      } else if (searchText.includes('@')) {
        this.searchResults = [];
        this.searchForUsers(searchText);
      } else {
        this.searchResults = [];
        this.searchForUsers(searchText);
      }
    }
  }

  searchForUsers(queryText: string): void {
    this.firebaseService.searchUsers(queryText).subscribe(
      (results) => {
        this.searchResults = results;
      },
      (error) => {
        console.error('Error fetching user search results:', error);
      }
    );
  }

  searchForChannels(queryText: string): void {
    this.firebaseService.searchChannels(queryText).subscribe(
      (results) => {
        this.searchResults = results;
      },
      (error) => {
        console.error('Error fetching channel search results:', error);
      }
    );
  }

  onSelectResult(result: any) {
    console.log('Selected Result:', result);
    // Handle the result selection (e.g., initiate a chat)
  }
}
