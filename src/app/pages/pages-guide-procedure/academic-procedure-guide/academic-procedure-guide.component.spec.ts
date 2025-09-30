import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicProcedureGuideComponent } from './academic-procedure-guide.component';

describe('AcademicProcedureGuideComponent', () => {
  let component: AcademicProcedureGuideComponent;
  let fixture: ComponentFixture<AcademicProcedureGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicProcedureGuideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicProcedureGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
