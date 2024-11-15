import { TestBed } from '@angular/core/testing';

import { UploadCareService } from './uploadcare.service';

describe('UploadCareService', () => {
  let service: UploadCareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadCareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
