import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelancesComponent } from './freelances.component';

describe('FreelancesComponent', () => {
  let component: FreelancesComponent;
  let fixture: ComponentFixture<FreelancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelancesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreelancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
