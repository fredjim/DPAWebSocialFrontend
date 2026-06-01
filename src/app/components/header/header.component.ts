import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Institution } from '../../posts/models/institution';
import { PostService } from '../../posts/services/post.service';
import { TenantService } from '../../services/tenant.service';
import { Subject, takeUntil } from 'rxjs';
import { Modal } from 'bootstrap';
import { AuthService } from '../../authentication/services/auth.service';
import { UserDetail } from '../../posts/models/user-detail';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  institution!: Institution
  authenticated: boolean = false;
  
  isMobileMenuOpen = false;
  @Input() hideArrowBackHome = true;
  user: UserDetail | null = null;
  currentSlug: string = '';
  private readonly destroy$ = new Subject<void>();
  private modalInstance?: Modal; // Para gestionar el modal
  menuItemsPopup: MenuItem[] = [];

  constructor(private readonly authService: AuthService,
    private readonly postService: PostService,
    private readonly tenantService: TenantService) {
    this.authenticated = authService.isAuthenticated();
  }

  ngOnInit() {
    this.currentSlug = this.tenantService.getSlug();
    this.getInstitution();
    this.getUser();
  }

  ngOnDestroy() {
    // Limpiar modal si existe
    if (this.modalInstance) {
      this.modalInstance.dispose();
      this.modalInstance = undefined;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildMenu() {
    if (this.authenticated && this.user) {
      this.menuItemsPopup = [
        {
          label: 'Ver perfil',
          routerLink: ['/', this.currentSlug, 'profile'],
          routerLinkActiveOptions: 'active'
        },
        {
          label: 'Ver página',
          routerLink: ['/', this.currentSlug, 'institution'],
          visible: this.user.role === 'ADMIN'
        },
        {
          label: 'Cerrar Sesión',
          command: () => this.logout()
        }
      ];
    } else {
      this.menuItemsPopup = [
        {
          label: 'Iniciar Sesión',
          command: () => this.openModal('loginModal')
        },
        {
          label: 'Registrarse',
          command: () => this.openModal('registerModal')
        }
      ];
    }
  }

  private openModal(id: string) {
    const el = document.getElementById(id);
    if (el) {
      const modal = new (globalThis as any).bootstrap.Modal(el);
      modal.show();
    }
  }

  private getInstitution() {
    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institutionData) => {
          this.institution = institutionData;
        },
        error: () => {}
      });
  }

  private getUser() {
    if (this.authenticated) {
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (infoUser) => {
            this.user = infoUser;
            this.buildMenu();
          },
          error: (error) => {
            console.log('Error al obtener al user', error);
            this.buildMenu(); // menú sin datos de usuario
          }
        });
    } else {
      this.buildMenu(); // para usuario no autenticado
    }
  }

  logout() {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

}
