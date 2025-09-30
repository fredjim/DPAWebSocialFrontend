import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarProcedureGuideComponent } from './navbar-procedure-guide.component';

describe('NavbarProcedureGuideComponent', () => {
  let component: NavbarProcedureGuideComponent;
  let fixture: ComponentFixture<NavbarProcedureGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavbarProcedureGuideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NavbarProcedureGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
