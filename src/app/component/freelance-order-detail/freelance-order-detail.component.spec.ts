import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelanceOrderDetailComponent } from './freelance-order-detail.component';

describe('FreelanceOrderDetailComponent', () => {
  let component: FreelanceOrderDetailComponent;
  let fixture: ComponentFixture<FreelanceOrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelanceOrderDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreelanceOrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
