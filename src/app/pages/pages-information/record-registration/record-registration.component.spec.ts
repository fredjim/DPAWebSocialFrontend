import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordRegistrationComponent } from './record-registration.component';

describe('RecordRegistrationComponent', () => {
  let component: RecordRegistrationComponent;
  let fixture: ComponentFixture<RecordRegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecordRegistrationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecordRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
