import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesGaiaComponent } from './pages-gaia.component';

describe('PagesGaiaComponent', () => {
  let component: PagesGaiaComponent;
  let fixture: ComponentFixture<PagesGaiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesGaiaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagesGaiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
