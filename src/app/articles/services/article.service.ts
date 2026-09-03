import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Article } from '../models/article';
import { Link } from '../models/link';
import { UploadedMedia } from '../../shared/models/uploaded-media';
import { CreateUpdateArticle } from '../models/create-update-article';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly articlesUrl: string = 'articles';

  constructor(
    private readonly http: HttpClient
  ) {}

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
    return this.http.put<Article>(`${this.ROOT_URL}/${this.articlesUrl}/${uuidArticle}`, updatedArticle);
  }

  // POST article
  createArticle(newArticle: Omit<CreateUpdateArticle, 'uuid' | 'user_id' | 'links'> & {links: Array<Omit<Link, 'uuid'>> }): Observable<Article> {
    return this.http.post<Article>(`${this.ROOT_URL}/${this.articlesUrl}`, newArticle);
  }

  // DELETE Article
  deleteArticle(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/${this.articlesUrl}/${uuid}`);
  }

  uploadDocumentsForArticle(formData: FormData): Observable<UploadedMedia[]> {
    const uploadDocs = 'documents/articles';
    return this.http.post<UploadedMedia[]>(`${this.ROOT_URL}/${uploadDocs}`, formData);
  }
}
