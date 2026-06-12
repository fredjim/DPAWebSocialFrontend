import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuItemsComponent } from './menu-items.component';

describe('NavbarComponent', () => {
  let component: MenuItemsComponent;
  let fixture: ComponentFixture<MenuItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenuItemsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MenuItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
