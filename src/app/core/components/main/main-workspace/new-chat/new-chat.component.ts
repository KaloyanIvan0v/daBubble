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

  // Close the search results
  onSearchChange(): void {
    const searchText = this.searchQuery.trim();

    this.selectedUserPhotoURL = null;

    if (searchText) {
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
