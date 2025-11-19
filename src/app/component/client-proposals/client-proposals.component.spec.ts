import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProposalsComponent } from './client-proposals.component';

describe('ClientProposalsComponent', () => {
  let component: ClientProposalsComponent;
  let fixture: ComponentFixture<ClientProposalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProposalsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientProposalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
