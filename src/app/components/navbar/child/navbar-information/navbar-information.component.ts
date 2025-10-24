import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../../../../pages/services/information.service';
import { Section } from '../../../../pages/models/section';

@Component({
  selector: 'app-navbar-information',
  templateUrl: './navbar-information.component.html',
  styleUrl: './navbar-information.component.scss'
})
export class NavbarInformationComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  public sections: Section[] = []; 
  isMobileMenuOpen = false;

  routesOfSection = [
    'presentacion',
    'coordinacion-academica',
    'desarrollo-curricular',
    'personal-academico',
    'titulacion-alternativa',
    'seguimiento-academico',
    'registro-inscripciones'
  ]

  ngOnInit(): void {
    this.informationService.getAllSections().subscribe(secs => {
      this.sections = secs;
      console.log(this.sections);
    })
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = false;
    }
  }

}
