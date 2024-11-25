import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
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
  selectedUserPhotoURL: string | null = null;
  selectedUserName: string | null = null;
  isAutoSelected: boolean = false;

  constructor(private firebaseService: FirebaseServicesService) {}
  @ViewChild('searchInput', { static: false }) searchContainer!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (
      this.searchContainer &&
      !this.searchContainer.nativeElement.contains(event.target)
    ) {
      this.searchResults = [];
    }
  }

  onSearchChange(): void {
    const searchText = this.searchQuery.trim();

    this.resetAutoSelectedIfMismatch(searchText);

    if (searchText) {
      this.handleSearchQuery(searchText);
    } else {
      this.clearSearchState();
    }
  }

  resetAutoSelectedIfMismatch(searchText: string): void {
    if (this.isAutoSelected && searchText !== `@${this.selectedUserName}`) {
      this.selectedUserPhotoURL = null;
      this.selectedUserName = null;
      this.isAutoSelected = false;
    }
  }

  handleSearchQuery(searchText: string): void {
    if (searchText.startsWith('@')) {
      this.searchResults = [];
      this.searchForUsers(searchText);
    } else if (searchText.startsWith('#')) {
      this.searchResults = [];
      this.searchForChannels(searchText);
    } else {
      this.searchResults = [];
      this.searchForUsers(searchText);
    }
  }

  clearSearchState(): void {
    this.searchResults = [];
    this.selectedUserPhotoURL = null;
    this.selectedUserName = null;
    this.isAutoSelected = false;
  }

  searchForUsers(queryText: string): void {
    this.firebaseService.searchUsers(queryText).subscribe(
      (results) => {
        this.searchResults = results;

        // Auto-select if there's exactly one match
        if (queryText.length >= 3 && results.length === 1) {
          this.autoSelectUser(results[0]);
        }
      },
      (error) => {
        console.error('Error fetching user search results:', error);
      }
    );
  }

  autoSelectUser(user: any): void {
    if (!this.isAutoSelected) {
      this.selectedUserPhotoURL = user.photoURL;
      this.selectedUserName = user.name;
      this.searchQuery = `@${user.name}`; // Update only on initial selection
      this.searchResults = []; // Clear the results after auto-selecting
      this.isAutoSelected = true;
    }
  }

  searchForChannels(queryText: string): void {
    const channelName = queryText.slice(1).toLowerCase();
    this.firebaseService.searchChannels(channelName).subscribe(
      (results) => {
        this.searchResults = results;
      },
      (error) => {
        console.error('Error fetching channel search results:', error);
      }
    );
  }

  onSelectResult(result: any) {
    if (result.name) {
      if (result.email) {
        this.searchQuery = `@ ${result.name}`;
        this.selectedUserPhotoURL = result.photoURL || '';
      } else {
        this.searchQuery = `# ${result.name}`;
        this.selectedUserPhotoURL = '';
      }
    } else if (result.email) {
      this.searchQuery = result.email;
    }
    this.searchResults = [];
  }

  selectedIndex: number = -1;

  onKeyDown(event: KeyboardEvent) {
    if (!this.searchResults.length) return;

    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
      event.preventDefault();
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.searchResults.length) %
        this.searchResults.length;
      event.preventDefault();
    } else if (event.key === 'Enter' && this.selectedIndex >= 0) {
      this.onSelectResult(this.searchResults[this.selectedIndex]);
      event.preventDefault();
    }
  }
}
