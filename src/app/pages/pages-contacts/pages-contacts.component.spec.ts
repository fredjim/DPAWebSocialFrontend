import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagesContactsComponent } from './pages-contacts.component';

describe('PagesContactsComponent', () => {
  let component: PagesContactsComponent;
  let fixture: ComponentFixture<PagesContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagesContactsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PagesContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
