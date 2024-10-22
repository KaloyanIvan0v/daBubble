import { AuthUIService } from './authUI.service';
import { TestBed } from '@angular/core/testing';

describe('AuthUIService', () => {
  let service: AuthUIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthUIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
