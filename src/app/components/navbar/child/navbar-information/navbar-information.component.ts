import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar-information',
  templateUrl: './navbar-information.component.html',
  styleUrl: './navbar-information.component.scss'
})
export class NavbarInformationComponent {

  isMobileMenuOpen = false;
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = false;
    }
  }

}
