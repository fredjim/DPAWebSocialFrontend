import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicCoordinationComponent } from './academic-coordination.component';

describe('AcademicCoordinationComponent', () => {
  let component: AcademicCoordinationComponent;
  let fixture: ComponentFixture<AcademicCoordinationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicCoordinationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicCoordinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
