import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelanceDashboardComponent } from './freelance-dashboard.component';

describe('FreelanceDashboardComponent', () => {
  let component: FreelanceDashboardComponent;
  let fixture: ComponentFixture<FreelanceDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelanceDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreelanceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
