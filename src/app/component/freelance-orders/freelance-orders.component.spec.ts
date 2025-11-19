import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelanceOrdersComponent } from './freelance-orders.component';

describe('FreelanceOrdersComponent', () => {
  let component: FreelanceOrdersComponent;
  let fixture: ComponentFixture<FreelanceOrdersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelanceOrdersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreelanceOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
