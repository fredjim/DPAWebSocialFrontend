import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NavItem } from '../../../shared/models/nav-item';
import { UserDetail } from '../../../posts/models/user-detail';
import { AuthService } from '../../../authentication/services/auth.service';
import { PostService } from '../../../posts/services/post.service';
import { NavItemService } from '../../services/nav-item.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-menu-items',
  templateUrl: './menu-items.component.html',
  styleUrls: ['./menu-items.component.scss']
})
export class MenuItemsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly navItemService = inject(NavItemService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('customToast') customToast!: CustomToastComponent;

  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public navItemToEdit!: NavItem | null;
  public typeForm: 'create' | 'edit' = 'create';
  public navItems: NavItem[] = [];
  visible = false;
  @Input() labelButtonNewMenu: string = '';
  @Output() closeMenuHamburguer = new EventEmitter<void>();

  ngOnInit(): void {
    this.navItemService.getAllNavItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resNavItems) => {
          this.navItems = resNavItems;
        },
        error: (error) => {
          console.log('error al obtener nav items', error)
        }
      });

    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showDialog() {
    this.typeForm = 'create';
    this.visible = true;
  }

  closeMenuNav(): void {
    this.closeMenuHamburguer.emit();
  }

  showModalEdit(menu: NavItem) {
    this.navItemToEdit = {...menu};
    this.typeForm = 'edit';
    this.visible = true;
  }

  onCreatedNavItem(event: { menus?: NavItem[], error?: any }) {
    if(event.menus){
      this.navItems = structuredClone(event.menus).sort((a, b) => a.orderIndex - b.orderIndex);
      this.customToast.showSuccess('Menú creado exitosamente');
    }else{
      if (event.error?.status === 409) {
        this.customToast.showError('Ya existe un menú con esa ruta.');
      } else {
        this.customToast.showError('Error al crear menú');
      }
    }
  }

  onEditedNavItem(event: { menus?: NavItem[], error?: any }) {
    if(event.menus){
      this.navItems = structuredClone(event.menus).sort((a, b) => a.orderIndex - b.orderIndex);
      this.customToast.showSuccess('Menú actualizado exitosamente');
    }else{
      if (event.error?.status === 409) {
        this.customToast.showError('Ya existe un menú con esa ruta.');
      } else {
        this.customToast.showError('Error al actualizar menú');
      }
    }
  }

  onDeleteNavItem(event: { menu?: NavItem | null, error?: any }) {
    if(event.menu){
      this.navItems = this.navItems.filter(menu => menu.uuid !== event.menu?.uuid);
      const currentNavItemPath = this.route.snapshot.firstChild?.paramMap.get('pathNavItem');
      if(currentNavItemPath === event.menu.path){
        // Si el nav item eliminado es el que se está visualizando, redirigir al inicio
        this.router.navigate(['/'], { replaceUrl: true });
      }
      this.customToast.showSuccess('Menú eliminado exitosamente');
    }else{
      this.customToast.showError('Error al eliminar menú');
    }
  }

  getLastOrderIndexNavItem(): number {
    return this.navItems.at(-1)?.orderIndex ?? this.navItems.length
  }
}
