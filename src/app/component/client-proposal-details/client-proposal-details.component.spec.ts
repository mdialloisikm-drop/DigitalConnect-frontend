import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProposalDetailsComponent } from './client-proposal-details.component';

describe('ClientProposalDetailsComponent', () => {
  let component: ClientProposalDetailsComponent;
  let fixture: ComponentFixture<ClientProposalDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientProposalDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientProposalDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
