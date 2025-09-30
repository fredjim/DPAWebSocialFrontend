import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesLinksComponent } from './pages-links.component';

describe('PagesLinksComponent', () => {
  let component: PagesLinksComponent;
  let fixture: ComponentFixture<PagesLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesLinksComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagesLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
