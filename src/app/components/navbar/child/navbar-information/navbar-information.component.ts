import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { InformationService } from '../../../../pages/services/information.service';
import { Section } from '../../../../pages/models/section';
import { UserDetail } from '../../../../posts/models/user-detail';
import { AuthService } from '../../../../authentication/services/auth.service';
import { PostService } from '../../../../posts/services/post.service';
import { NavItem } from '../../../../pages/models/nav-item';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-navbar-information',
  templateUrl: './navbar-information.component.html',
  styleUrl: './navbar-information.component.scss'
})
export class NavbarInformationComponent implements OnInit, OnChanges, OnDestroy {
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  public sections: Section[] = []; 
  isMobileMenuOpen = false;
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public showButtonNewSection = true;

  @Input() currentNavItem!: NavItem;
  @Output() collapse = new EventEmitter<void>(); 
  uuidSectionToEdit: string = '';

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().pipe(
        takeUntil(this.destroy$)
      ).subscribe(user => {
        this.currentUser = user;
      });
    }
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
    this.informationService.getAllSectionsByNavItemId(this.currentNavItem.uuid)
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
    const currentNavItemUuid = this.route.snapshot.paramMap.get('uuidNavItem');
    // Comparar con el navItem actual del componente
    return currentNavItemUuid === this.currentNavItem?.uuid;
  }

  private isCurrentSectionValid(): boolean {
    const currentSectionUuid = this.route.snapshot.firstChild?.paramMap.get('uuidSection') ?? null;
    return this.sections.some(section => section.uuid === currentSectionUuid);
  }

  private navigateToFirstSection(): void {
    const firstSection = this.sections[0];
    this.router.navigate([firstSection.uuid], {
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

  onCreatedSection(created: Section): void {
    this.sections.push(created);
  }

  onDeletedSection(deleted: Section): void {
    this.sections = this.sections.filter(sec => sec.uuid !== deleted.uuid);
  }

  onEditSection(edited: Section): void {
    this.sections = this.sections.map(sec => sec.uuid === edited.uuid ? edited : sec);
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
