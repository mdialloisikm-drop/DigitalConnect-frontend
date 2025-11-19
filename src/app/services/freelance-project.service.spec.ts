import { TestBed } from '@angular/core/testing';

import { FreelanceProjectService } from './freelance-project.service';

describe('FreelanceProjectService', () => {
  let service: FreelanceProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FreelanceProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
