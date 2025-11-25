import { TestBed } from '@angular/core/testing';

import { AdminModerationService } from './admin-moderation.service';

describe('AdminModerationService', () => {
  let service: AdminModerationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminModerationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
