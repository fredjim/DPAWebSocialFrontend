import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../authentication/services/auth.service';
import { Observable } from 'rxjs';
import { Section } from '../models/section';
import { Article } from '../models/article';

@Injectable({
  providedIn: 'root'
})
export class InformationService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  private readonly sectionsUrl: string = 'sections';
  private readonly articlesUrl: string = 'articles';

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

  // Sections
  // GET section
  getAllSections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.ROOT_URL}/${this.sectionsUrl}`);
  }

  getSectionByParam(queryParam: string): Observable<Section>{
    return this.http.get<Section>(`${this.ROOT_URL}/${this.sectionsUrl}?name=${queryParam}`);
  }

  getSectionByUuid(uuid: string): Observable<Section> {
    return this.http.get<Section>(`${this.ROOT_URL}/${this.sectionsUrl}/${uuid}`);
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
