import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreelanceLayoutComponent } from './freelance-layout.component';

describe('FreelanceLayoutComponent', () => {
  let component: FreelanceLayoutComponent;
  let fixture: ComponentFixture<FreelanceLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreelanceLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FreelanceLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
