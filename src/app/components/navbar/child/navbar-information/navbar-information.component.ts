import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../../../../pages/services/information.service';
import { Section } from '../../../../pages/models/section';
import { UserDetail } from '../../../../posts/models/user-detail';
import { AuthService } from '../../../../authentication/services/auth.service';
import { PostService } from '../../../../posts/services/post.service';

@Component({
  selector: 'app-navbar-information',
  templateUrl: './navbar-information.component.html',
  styleUrl: './navbar-information.component.scss'
})
export class NavbarInformationComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  public sections: Section[] = []; 
  isMobileMenuOpen = false;
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public showButtonNewSection = true;

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
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }
    this.informationService.getAllSections().subscribe(secs => {
      this.sections = secs;
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

  onCreatedSection(created: Section): void {
    this.sections.push(created);
  }

  onDeletedSection(deleted: Section): void {
    this.sections = this.sections.filter(sec => sec.uuid !== deleted.uuid);
  }

  hideButtonNewSection(): void {
    this.showButtonNewSection = false;
  }
}
