import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicCoordintationGuideComponent } from './academic-coordintation-guide.component';

describe('AcademicCoordintationGuideComponent', () => {
  let component: AcademicCoordintationGuideComponent;
  let fixture: ComponentFixture<AcademicCoordintationGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicCoordintationGuideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicCoordintationGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
