import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesGuideProcedureComponent } from './pages-guide-procedure.component';

describe('PagesGuideProcedureComponent', () => {
  let component: PagesGuideProcedureComponent;
  let fixture: ComponentFixture<PagesGuideProcedureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesGuideProcedureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagesGuideProcedureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
