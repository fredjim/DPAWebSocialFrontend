import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicPersonnelComponent } from './academic-personnel.component';

describe('AcademicPersonnelComponent', () => {
  let component: AcademicPersonnelComponent;
  let fixture: ComponentFixture<AcademicPersonnelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicPersonnelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicPersonnelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
