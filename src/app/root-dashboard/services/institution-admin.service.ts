import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Institution } from '../models/institution.model';

@Injectable({ providedIn: 'root' })
export class InstitutionAdminService {

  private readonly BASE_URL = `${environment.BACK_END_HOST_DEV}/institutions`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Institution[]> {
    return this.http.get<Institution[]>(this.BASE_URL);
  }

  // API has no GET /institutions/{uuid} — filter from the full list
  getById(uuid: string): Observable<Institution> {
    return this.getAll().pipe(
      map(list => {
        const found = list.find(i => i.uuid === uuid);
        if (!found) throw new Error(`Institution ${uuid} not found`);
        return found;
      })
    );
  }

  create(dto: Institution): Observable<Institution> {
    return this.http.post<Institution>(this.BASE_URL, dto);
  }

  // PUT /api/v1/institutions — uuid in body, NOT in the path
  update(dto: Institution): Observable<Institution> {
    const { logo_url, background_url, ...fields } = dto as any;
    return this.http.put<Institution>(this.BASE_URL, fields);
  }

  delete(uuid: string): Observable<Institution> {
    return this.http.delete<Institution>(`${this.BASE_URL}/${uuid}`);
  }
}
