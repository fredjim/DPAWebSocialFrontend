import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesInformationComponent } from './pages-information.component';

describe('PagesInformationComponent', () => {
  let component: PagesInformationComponent;
  let fixture: ComponentFixture<PagesInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesInformationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagesInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
