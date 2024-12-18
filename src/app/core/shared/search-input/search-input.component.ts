import { Component } from '@angular/core';
import { SearchService } from '../services/search-service/search.service';
import { FirebaseServicesService } from '../services/firebase/firebase.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  constructor(
    public firebaseService: FirebaseServicesService,
    public searchService: SearchService
  ) {}

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    const queryText = input.value;
    if (queryText.trim()) {
      this.firebaseService
        .searchAllChannelsAndUsers(queryText)
        .subscribe((results) => {
          this.searchService.headerSearchResults =
            this.searchService.filterOutLoggedInUser(results);
        });
    } else {
      this.searchService.headerSearchResults = [];
    }
  }
}
