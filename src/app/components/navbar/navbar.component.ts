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
  public navItemToEdit!: NavItem | undefined;
  public typeForm: 'create' | 'edit' = 'create';
  public navItems: NavItem[] = [];
  localNavItems: any[] = []
  visible = false;

  ngOnInit(): void {
    this.informationService.getAllNavItems().subscribe({
      next: (resNavItems) => {
        this.navItems = resNavItems;
        console.log('res',this.navItems)
      },
      error: (error) => {
        console.log('error al obtener nav items', error)
      }
    })
    this.localNavItems = [
      { uuid: 1, label: 'Información', url: '/informacion',},
      { uuid: 2, label: 'Guía y seguimiento de trámites', url: '/guia-seguimiento-tramites',},
      { uuid: 3, label: 'GAIA', url: '/gaia',},
      { uuid: 4, label: 'Contactos', url: '/contactos',},
    ];

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
    this.navItemToEdit = menu;
    this.typeForm = 'edit';
    this.visible = true;
  }

  onCreatedNavItem(event: {created?: NavItem, error?: any}) {
    this.localNavItems.push({
      uuid: 10,
      label: 'NavItem 1',
      url: '/urlName'
    })
    if(event.created){
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú creado exitosamente' });
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear menú' });
    }
  }

  onEditedNavItem(event: {edited?: NavItem, error?: any}) {
    if(event.edited){
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú actualizado exitosamente' });
      this.localNavItems = this.localNavItems.map(menu => menu.uuid === event.edited?.uuid ? event.edited : menu);
    }else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar sección' });
    }
  }

  onDeleteNavItem(event: {deleted?: NavItem, error?: any}) {
    if(event.deleted){
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú eliminado exitosamente' });
      this.localNavItems = this.localNavItems.filter(menu => menu.uuid !== event.deleted?.uuid);
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
    }
  }
}
