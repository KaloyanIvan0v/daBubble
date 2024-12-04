import { TestBed } from '@angular/core/testing';

import { StatefulWindowServiceService } from './stateful-window-service.service';

describe('StatefulWindowServiceService', () => {
  let service: StatefulWindowServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatefulWindowServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
