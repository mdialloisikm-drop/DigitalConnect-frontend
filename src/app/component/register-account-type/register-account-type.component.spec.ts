import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterAccountTypeComponent } from './register-account-type.component';

describe('RegisterAccountTypeComponent', () => {
  let component: RegisterAccountTypeComponent;
  let fixture: ComponentFixture<RegisterAccountTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterAccountTypeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterAccountTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
