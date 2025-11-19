import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelanceServicesComponent } from './freelance-services.component';

describe('FreelanceServicesComponent', () => {
  let component: FreelanceServicesComponent;
  let fixture: ComponentFixture<FreelanceServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelanceServicesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreelanceServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
