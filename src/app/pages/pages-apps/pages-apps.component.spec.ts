import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesAppsComponent } from './pages-apps.component';

describe('PagesAppsComponent', () => {
  let component: PagesAppsComponent;
  let fixture: ComponentFixture<PagesAppsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesAppsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagesAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
