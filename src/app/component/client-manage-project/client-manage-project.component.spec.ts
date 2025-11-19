import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientManageProjectComponent } from './client-manage-project.component';

describe('ClientManageProjectComponent', () => {
  let component: ClientManageProjectComponent;
  let fixture: ComponentFixture<ClientManageProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientManageProjectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientManageProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
