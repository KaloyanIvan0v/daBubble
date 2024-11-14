import { TestBed } from '@angular/core/testing';

import { UploadcareService } from './uploadcare.service';

describe('UploadcareService', () => {
  let service: UploadcareService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadcareService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
