import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarInformationComponent } from './sections-panel.component';

describe('NavbarInformationComponent', () => {
  let component: NavbarInformationComponent;
  let fixture: ComponentFixture<NavbarInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavbarInformationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NavbarInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
