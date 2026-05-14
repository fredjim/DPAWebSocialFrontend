import { Component, signal } from '@angular/core';
import { RootAuthService } from '../../services/root-auth.service';

@Component({
  selector: 'app-root-layout',
  templateUrl: './root-layout.component.html',
  styleUrl: './root-layout.component.scss'
})
export class RootLayoutComponent {

  isCollapsed = signal(false);

  constructor(private readonly rootAuthService: RootAuthService) {}

  toggleSidebar(): void {
    this.isCollapsed.update(v => !v);
  }

  logout(): void {
    this.rootAuthService.rootLogout();
  }
}
