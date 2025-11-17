import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NavItem } from '../models/nav-item';

@Injectable({ providedIn: 'root' })
export class NavItemStateService {
  private readonly editNavItemSource = new BehaviorSubject<NavItem | null>(null);
  currentNavItem$ = this.editNavItemSource.asObservable();

  setNavItemToEdit(navItem: NavItem | null): void {
    this.editNavItemSource.next(navItem);
  }

  clearNavItem() {
    this.editNavItemSource.next(null);
  }

  getCurrentNavItem(): NavItem | null {
    return this.editNavItemSource.getValue();
  }
}