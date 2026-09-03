import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Section } from '../../shared/models/section';

@Injectable({
  providedIn: 'root'
})
export class SectionService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly sectionsUrl: string = 'sections';

  constructor(
    private readonly http: HttpClient
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
    return this.http.put<Section>(`${this.ROOT_URL}/${this.sectionsUrl}/${updatedSection.uuid}`, updatedSection);
  }

  // POST section
  createSection(newSection: Omit<Section, 'uuid' | 'user_id' | 'articles'>): Observable<Section> {
    return this.http.post<Section>(`${this.ROOT_URL}/${this.sectionsUrl}`, newSection);
  }

  // DELETE section
  deleteSection(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/${this.sectionsUrl}/${uuid}`);
  }
}