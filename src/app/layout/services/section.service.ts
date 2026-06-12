import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../authentication/services/auth.service';
import { Observable } from 'rxjs';
import { Section } from '../../shared/models/section';

@Injectable({
  providedIn: 'root'
})
export class SectionService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  private readonly sectionsUrl: string = 'sections';

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

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
}