import { TestBed } from '@angular/core/testing';

import { EmojiPickerService } from './emoji-picker.service';

describe('EmojiPickerService', () => {
  let service: EmojiPickerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmojiPickerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
