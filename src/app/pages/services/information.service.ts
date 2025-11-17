import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../authentication/services/auth.service';
import { Observable } from 'rxjs';
import { Section } from '../models/section';
import { Article } from '../models/article';
import { NavItem } from '../models/nav-item';

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
  updateNavItem(updatedNavItem: NavItem): Observable<NavItem> {
    return this.http.put<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}/${updatedNavItem.uuid}`, updatedNavItem, this.reqHeader);
  }

  // POST nav item
  createNavItem(newNavItem: Omit<NavItem, 'uuid' | 'user_id' | 'createdDate' | 'lastModifiedDate'>): Observable<NavItem> {
    return this.http.post<NavItem>(`${this.ROOT_URL}/${this.navItemUrl}`, newNavItem, this.reqHeader);
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

  getSectionByParam(queryParam: string): Observable<Section>{
    return this.http.get<Section>(`${this.ROOT_URL}/${this.sectionsUrl}?name=${queryParam}`);
  }

  getSectionByRoute(route: string | null): Observable<Section | null> {
    return this.http.get<Section>(`${this.ROOT_URL}/${this.sectionsUrl}/${route}`);
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
  updateArticle(uuidArticle: string, updatedArticle: any): Observable<Article> {
    return this.http.put<Article>(`${this.ROOT_URL}/${this.articlesUrl}/${uuidArticle}`, updatedArticle ,this.reqHeader)
  }

  // POST article
  createArticle(newArticle: Omit<Article, 'uuid' | 'user_id'>): Observable<Article> {
    return this.http.post<Article>(`${this.ROOT_URL}/${this.articlesUrl}`, newArticle, this.reqHeader);
  }

  // DELETE Article
  deleteArticle(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/${this.articlesUrl}/${uuid}`, this.reqHeader);
  }
}
