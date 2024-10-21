import { FocusService } from './focus.service';
import { TestBed } from '@angular/core/testing';

describe('FocusService', () => {
  let service: FocusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FocusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
