import { TestBed } from '@angular/core/testing';

import { RealtimeMessagingService } from './realtime-messaging.service';

describe('RealtimeMessagingService', () => {
  let service: RealtimeMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RealtimeMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
