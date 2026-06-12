import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { SectionService } from '../../services/section.service';
import { Section } from '../../../shared/models/section';
import { UserDetail } from '../../../shared/models/user-detail';
import { AuthService } from '../../../authentication/services/auth.service';
import { UserService } from '../../../user-profile/services/user.service';
import { NavItem } from '../../../shared/models/nav-item';
import { filter, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-sections-panel',
  templateUrl: './sections-panel.component.html',
  styleUrl: './sections-panel.component.scss'
})
export class SectionsPanelComponent implements OnInit, OnChanges, OnDestroy {
  private readonly sectionService = inject(SectionService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  public sections: Section[] = []; 
  isMobileMenuOpen = false;
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public showButtonNewSection = true;

  @Input() currentNavItem!: NavItem;
  @Input() isMobile: boolean = false;
  @Output() collapse = new EventEmitter<void>(); 
  uuidSectionToEdit: string = '';
  @ViewChild('customToast') customToast!: CustomToastComponent;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.userService.getUser().pipe(
        takeUntil(this.destroy$)
      ).subscribe(user => {
        this.currentUser = user;
      });
    }

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const currentNavItemPath = this.route.snapshot.paramMap.get('pathNavItem');
      
      if (currentNavItemPath && currentNavItemPath === this.currentNavItem?.path) {
        if (this.sections.length > 0 && !this.isCurrentSectionValid()) {
          this.navigateToFirstSection();
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['currentNavItem'] && this.currentNavItem){
      this.loadSections();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSections(): void {
    this.sectionService.getAllSectionsByNavItemId(this.currentNavItem.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(secs => {
        this.sections = secs;
        
        // Navegar al primer elemento solo si no estamos ya en una sección válida
        if (this.sections.length > 0 && this.isCurrentNavItemValid() && !this.isCurrentSectionValid()) {
          this.navigateToFirstSection();
        }
      });
  }

  private isCurrentNavItemValid(): boolean {
    const currentNavItemPath = this.route.snapshot.paramMap.get('pathNavItem');
    // Comparar con el navItem actual del componente
    return currentNavItemPath === this.currentNavItem?.path;
  }

  private isCurrentSectionValid(): boolean {
    const currentSectionPath = this.route.snapshot.firstChild?.paramMap.get('pathSection') ?? null;
    return this.sections.some(section => section.path === currentSectionPath);
  }

  private navigateToFirstSection(): void {
    const firstSection = this.sections[0];
    this.router.navigate([firstSection.path], {
      relativeTo: this.route,
      replaceUrl: true // Reemplaza la URL actual en el historial
    });
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.collapse.emit();
  }

  onCreatedSection(event: {section?: Section, error?: any}): void {
    if (event.section) {
      this.sections.push(event.section);
      this.customToast.showSuccess('Sección creada exitosamente');
    } else {
      if (event.error?.status === 409) {
        this.customToast.showError('Ya existe una sección con esa ruta.');
      } else {
        this.customToast.showError('Error al crear sección');
      }
    }
  }

  onDeletedSection(event: {section?: Section, error?: any}): void {
    if (event.section) {
      this.sections = this.sections.filter(sec => sec.uuid !== event.section?.uuid);
      this.customToast.showSuccess('Sección eliminada exitosamente');
    } else {
      this.customToast.showError('Error al eliminar sección');
    }
  }

  onEditSection(event: {section?: Section, error?: any}): void {
    if (event.section) {
      this.sections = this.sections.map(sec => sec.uuid === event.section?.uuid ? event.section : sec);
      this.customToast.showSuccess('Sección actualizada exitosamente');
    } else {
      if (event.error?.status === 409) {
        this.customToast.showError('Ya existe una sección con esa ruta.');
      } else {
        this.customToast.showError('Error al actualizar sección');
      }
    }
  }

  hideButtonNewSection(): void {
    this.showButtonNewSection = false;
  }

  editSectionByUuid(uuid: string): void {
    this.uuidSectionToEdit = uuid;
  }

  onCloseEditSection(): void {
    this.uuidSectionToEdit = '';
  }
}
