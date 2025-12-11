import { TestBed } from '@angular/core/testing';

import { FreelanceProfileService } from './freelance-profile.service';

describe('FreelanceProfileService', () => {
  let service: FreelanceProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FreelanceProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
