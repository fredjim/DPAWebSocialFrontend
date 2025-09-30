import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlternativeGraduationComponent } from './alternative-graduation.component';

describe('AlternativeGraduationComponent', () => {
  let component: AlternativeGraduationComponent;
  let fixture: ComponentFixture<AlternativeGraduationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AlternativeGraduationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AlternativeGraduationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
