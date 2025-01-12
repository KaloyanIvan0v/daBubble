import { TestBed } from '@angular/core/testing';

import { MentionUserService } from './mention-user.service';

describe('MentionUserService', () => {
  let service: MentionUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MentionUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
