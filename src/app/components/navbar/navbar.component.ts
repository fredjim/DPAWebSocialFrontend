import { Component, inject, OnInit } from '@angular/core';
import { Menu } from '../../pages/models/menu';
import { UserDetail } from '../../posts/models/user-detail';
import { AuthService } from '../../authentication/services/auth.service';
import { PostService } from '../../posts/services/post.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly messageService = inject(MessageService);

  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public menuToEdit!: Menu | undefined;
  public typeForm: 'create' | 'edit' = 'create';
  public menus: Menu[] = [];
  localMenus: any[] = []
  visible = false;

  ngOnInit(): void {
    this.localMenus = [
      { id: 1, name: 'Información', route: '/informacion',},
      { id: 2, name: 'Guía y seguimiento de trámites', route: '/guia-seguimiento-tramites',},
      { id: 3, name: 'GAIA', route: '/gaia',},
      { id: 4, name: 'Contactos', route: '/contactos',},
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

  showModalEdit(menu: Menu) {
    this.menuToEdit = menu;
    this.typeForm = 'edit';
    this.visible = true;
  }

  onCreatedMenu(event: {created?: Menu, error?: any}) {
    if(event.created){
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú creado exitosamente' });
      this.localMenus.push({
        id: 10,
        name: 'Menu 1',
        route: '/routeName'
      })
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear menú' });
    }
  }

  onEditedMenu(event: {edited?: Menu, error?: any}) {
    if(event.edited){
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú actualizado exitosamente' });
      this.localMenus = this.localMenus.map(menu => menu.uuid === event.edited?.uuid ? event.edited : menu);
    }else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar sección' });
    }
  }

  onDeleteMenu(event: {deleted?: Menu, error?: any}) {
    if(event.deleted){
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Menú eliminado exitosamente' });
      this.localMenus = this.localMenus.filter(menu => menu.uuid !== event.deleted?.uuid);
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
    }
  }
}
