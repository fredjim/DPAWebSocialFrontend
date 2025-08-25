import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicMonitoringGuideComponent } from './academic-monitoring-guide.component';

describe('AcademicMonitoringGuideComponent', () => {
  let component: AcademicMonitoringGuideComponent;
  let fixture: ComponentFixture<AcademicMonitoringGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicMonitoringGuideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicMonitoringGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
