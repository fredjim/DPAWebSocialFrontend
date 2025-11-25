import { Component, inject, OnInit } from '@angular/core';
import { NavItem } from '../../pages/models/nav-item';
import { UserDetail } from '../../posts/models/user-detail';
import { AuthService } from '../../authentication/services/auth.service';
import { PostService } from '../../posts/services/post.service';
import { MessageService } from 'primeng/api';
import { InformationService } from '../../pages/services/information.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly messageService = inject(MessageService);

  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public navItemToEdit!: NavItem | null;
  public typeForm: 'create' | 'edit' = 'create';
  public navItems: NavItem[] = [];
  visible = false;

  ngOnInit(): void {
    this.informationService.getAllNavItems().subscribe({
      next: (resNavItems) => {
        this.navItems = resNavItems;
      },
      error: (error) => {
        console.log('error al obtener nav items', error)
      }
    })

    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }
  }

  showDialog() {
    this.typeForm = 'create';
    this.visible = true;
  }

  showModalEdit(menu: NavItem) {
    this.navItemToEdit = {...menu};
    this.typeForm = 'edit';
    this.visible = true;
  }

  onCreatedNavItem(event: { menus?: NavItem[], error?: any }) {
    if(event.menus){
      this.navItems = structuredClone(event.menus).sort((a, b) => a.orderIndex - b.orderIndex);
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú creado exitosamente' });
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear menú' });
    }
  }

  onEditedNavItem(event: { menus?: NavItem[], error?: any }) {
    if(event.menus){
      this.navItems = structuredClone(event.menus).sort((a, b) => a.orderIndex - b.orderIndex);
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú actualizado exitosamente' });
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar sección' });
    }
  }

  onDeleteNavItem(event: { menu?: NavItem | null, error?: any }) {
    if(event.menu){
      this.navItems = this.navItems.filter(menu => menu.uuid !== event.menu?.uuid);
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú eliminado exitosamente' });
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
    }
  }

  getLastOrderIndexNavItem(): number {
    return this.navItems.at(-1)?.orderIndex ?? this.navItems.length
  }
}
