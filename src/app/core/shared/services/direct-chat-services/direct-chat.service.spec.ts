import { TestBed } from '@angular/core/testing';

import { DirectChatService } from './direct-chat.service';

describe('DirectChatService', () => {
  let service: DirectChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
