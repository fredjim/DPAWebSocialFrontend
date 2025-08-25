import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicMonitoringComponent } from './academic-monitoring.component';

describe('AcademicMonitoringComponent', () => {
  let component: AcademicMonitoringComponent;
  let fixture: ComponentFixture<AcademicMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicMonitoringComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AcademicMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
