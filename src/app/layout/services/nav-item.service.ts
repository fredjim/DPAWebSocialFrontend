import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, switchMap } from 'rxjs';
import { NavItem } from '../../shared/models/nav-item';

@Injectable({
  providedIn: 'root'
})
export class NavItemService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly navItemUrl: string = 'navitems';

  constructor(
    private readonly http: HttpClient
  ) {}

  // NavItem
  // GET nav items
  getAllNavItems(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(`${this.ROOT_URL}/${this.navItemUrl}`);
  }

  getNavItemById(uuid: string): Observable<NavItem> {
    return this.http.get<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}/${uuid}`);
  }

  // PUT nav item
  updateNavItem(updatedNavItem: NavItem): Observable<NavItem[]> {
    return this.http.put<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}/${updatedNavItem.uuid}`, updatedNavItem).pipe(
      switchMap(updatedItem => {
        return this.getAllNavItems().pipe(
          switchMap(allItems => {
            const itemsToUpdate = this.calculateNewOrder(allItems, updatedItem.uuid, updatedItem.orderIndex);
            return this.bulkUpdateNavItems(itemsToUpdate);
          })
        );
      })
    );
  }

  
  // POST nav item
  createNavItem(newNavItem: Omit<NavItem, 'uuid' | 'user_id' | 'createdDate' | 'lastModifiedDate'>): Observable<NavItem[]> {
    return this.http.post<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}`, newNavItem).pipe(
      switchMap(createdItem => {
        return this.getAllNavItems().pipe(
          switchMap(allItems => {
            const itemsToUpdate = this.calculateNewOrder(allItems, createdItem.uuid, createdItem.orderIndex);
            return this.bulkUpdateNavItems(itemsToUpdate);
          })
        );
      })
    );
  }
  
  // Actualizar múltiples items
  private bulkUpdateNavItems(items: NavItem[]): Observable<NavItem[]> {
    const updateRequests = items.map(item => 
      this.http.put<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}/${item.uuid}`, item)
    );
    
    return forkJoin(updateRequests);
  }

  // Calcular nuevo orden de menu items
  private calculateNewOrder(items: NavItem[], modifiedItemUuid: string, newOrderIndex: number): NavItem[] {
    // Remover el item modificado de la lista
    const itemsWithoutModified = items.filter(item => item.uuid !== modifiedItemUuid);
    
    // Crear nuevo array con el orden correcto
    const reorderedItems: NavItem[] = [];
    
    // Insertar items antes de la nueva posición
    for (let i = 0; i < newOrderIndex - 1; i++) {
      if (itemsWithoutModified[i]) {
        reorderedItems.push({ ...itemsWithoutModified[i], orderIndex: i + 1 });
      }
    }
    
    // Insertar el item modificado en su nueva posición
    const modifiedItem = items.find(item => item.uuid === modifiedItemUuid)!;
    reorderedItems.push({ ...modifiedItem, orderIndex: newOrderIndex });
    
    // Insertar el resto de items después de la nueva posición
    for (let i = newOrderIndex - 1; i < itemsWithoutModified.length; i++) {
      if (itemsWithoutModified[i]) {
        reorderedItems.push({ ...itemsWithoutModified[i], orderIndex: i + 2 });
      }
    }
    
    return reorderedItems;
  }

  // DELETE nav item
  deleteNavItem(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/${this.navItemUrl}/${uuid}`);
  }

}
