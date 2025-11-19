import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { freelanceGuard } from './freelance.guard';

describe('freelanceGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => freelanceGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
