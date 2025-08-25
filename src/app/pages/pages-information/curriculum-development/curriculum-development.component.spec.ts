import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumDevelopmentComponent } from './curriculum-development.component';

describe('CurriculumDevelopmentComponent', () => {
  let component: CurriculumDevelopmentComponent;
  let fixture: ComponentFixture<CurriculumDevelopmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CurriculumDevelopmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CurriculumDevelopmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
