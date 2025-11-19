import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesLayoutComponent } from './messages-layout.component';

describe('MessagesLayoutComponent', () => {
  let component: MessagesLayoutComponent;
  let fixture: ComponentFixture<MessagesLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MessagesLayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MessagesLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
