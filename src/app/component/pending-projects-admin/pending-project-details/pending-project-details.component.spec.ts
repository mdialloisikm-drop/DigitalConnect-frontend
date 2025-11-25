import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingProjectDetailsComponent } from './pending-project-details.component';

describe('PendingProjectDetailsComponent', () => {
  let component: PendingProjectDetailsComponent;
  let fixture: ComponentFixture<PendingProjectDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingProjectDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PendingProjectDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
