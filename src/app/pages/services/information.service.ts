import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../authentication/services/auth.service';
import { forkJoin, Observable, switchMap } from 'rxjs';
import { Section } from '../models/section';
import { Article } from '../models/article';
import { NavItem } from '../models/nav-item';
import { Link } from '../models/link';
import { UploadedMedia } from '../../posts/models/uploaded-media';
import { CreateUpdateArticle } from '../models/create-update-article';

@Injectable({
  providedIn: 'root'
})
export class InformationService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  private readonly insitutionUuid: string = '93j203b4-f63b-4c4a-be05-eae84cef0c0c';
  private readonly navItemUrl: string = 'navitems';
  private readonly sectionsUrl: string = 'sections';
  private readonly articlesUrl: string = 'articles';

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

  // NavItem
  // GET nav items
  getAllNavItems(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(`${this.ROOT_URL}/${this.navItemUrl}?institution_id=${this.insitutionUuid}`);
  }

  getNavItemById(uuid: string): Observable<NavItem> {
    return this.http.get<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}/${uuid}`);
  }

  // PUT nav item
  updateNavItem(updatedNavItem: NavItem): Observable<NavItem[]> {
    return this.http.put<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}/${updatedNavItem.uuid}`, updatedNavItem, this.reqHeader).pipe(
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
    return this.http.post<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}`, newNavItem, this.reqHeader).pipe(
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

  // Calcular nuevo orden
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
    return this.http.delete<void>(`${this.ROOT_URL}/${this.navItemUrl}/${uuid}`, this.reqHeader);
  }

  // Sections
  // GET section
  getAllSections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.ROOT_URL}/${this.sectionsUrl}`);
  }

  getAllSectionsByNavItemId(uuid: string): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.ROOT_URL}/${this.sectionsUrl}/by-nav/${uuid}`);
  }

  getSectionByPath(queryParam: string): Observable<Section>{
    return this.http.get<Section>(`${this.ROOT_URL}/${this.sectionsUrl}?path=${queryParam}`);
  }

  getSectionById(uuid: string): Observable<Section> {
    return this.http.get<Section>(`${this.ROOT_URL}/${this.sectionsUrl}/${uuid}`);
  }

  // PUT section
  updateSection(updatedSection: Section): Observable<Section> {
    return this.http.put<Section>(`${this.ROOT_URL}/${this.sectionsUrl}/${updatedSection.uuid}`, updatedSection, this.reqHeader);
  }

  // POST section
  createSection(newSection: Omit<Section, 'uuid' | 'user_id' | 'articles'>): Observable<Section> {
    return this.http.post<Section>(`${this.ROOT_URL}/${this.sectionsUrl}`, newSection, this.reqHeader);
  }

  // DELETE section
  deleteSection(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/${this.sectionsUrl}/${uuid}`, this.reqHeader);
  }

  // Articles 
  // GET articles
  getAllArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.ROOT_URL}/${this.articlesUrl}`);
  }

  // GET articles by section uuid
  getArticlesBySectionUuid(uuidSection: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.ROOT_URL}/${this.articlesUrl}/section/${uuidSection}`);
  }

  // PUT articles
  updateArticle(uuidArticle: string, updatedArticle: CreateUpdateArticle): Observable<Article> {
    return this.http.put<Article>(`${this.ROOT_URL}/${this.articlesUrl}/${uuidArticle}`, updatedArticle ,this.reqHeader)
  }

  // POST article
  createArticle(newArticle: Omit<CreateUpdateArticle, 'uuid' | 'user_id' | 'links'> & {links: Array<Omit<Link, 'uuid'>> }): Observable<Article> {
    return this.http.post<Article>(`${this.ROOT_URL}/${this.articlesUrl}`, newArticle, this.reqHeader);
  }

  // DELETE Article
  deleteArticle(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/${this.articlesUrl}/${uuid}`, this.reqHeader);
  }

  uploadDocumentsForArticle(formData: FormData): Observable<UploadedMedia[]> {
    const uploadDocs = 'documents/articles';
    return this.http.post<UploadedMedia[]>(`${this.ROOT_URL}/${uploadDocs}`, formData, this.reqHeader);
  }
}
