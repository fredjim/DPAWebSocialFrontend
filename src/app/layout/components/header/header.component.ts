import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UserStateService } from '../../../core/services/user-state.service';
import { TenantService } from '../../../core/services/tenant.service';
import { Subject, takeUntil } from 'rxjs';
import { Modal } from 'bootstrap';
import { AuthService } from '../../../authentication/services/auth.service';
import { UserDetail } from '../../../shared/models/user-detail';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  authenticated: boolean = false;
  
  isMobileMenuOpen = false;
  @Input() hideArrowBackHome = true;
  user: UserDetail | null = null;
  currentSlug: string = '';
  private readonly destroy$ = new Subject<void>();
  private modalInstance?: Modal; // Para gestionar el modal
  menuItemsPopup: MenuItem[] = [];

  constructor(private readonly authService: AuthService,
    private readonly userStateService: UserStateService,
    private readonly tenantService: TenantService) {
    this.authenticated = authService.isAuthenticated();
  }

  ngOnInit() {
    this.currentSlug = this.tenantService.getSlug();
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
      const modal = Modal.getOrCreateInstance(el);
      modal.show();
    }
  }

  private getUser() {
    this.userStateService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.authenticated = !!user;
          this.user = user;
          this.buildMenu();
        },
        error: (error) => {
          console.log('Error al obtener al user', error);
          this.authenticated = false;
          this.user = null;
          this.buildMenu();
        }
      });
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
