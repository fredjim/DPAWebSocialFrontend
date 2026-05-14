import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Institution } from '../models/institution.model';

@Injectable({ providedIn: 'root' })
export class InstitutionAdminService {

  private readonly BASE_URL = `${environment.BACK_END_HOST_DEV}/institutions`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Institution[]> {
    return this.http.get<Institution[]>(this.BASE_URL);
  }

  getById(uuid: string): Observable<Institution> {
    return this.http.get<Institution>(`${this.BASE_URL}/${uuid}`);
  }

  create(dto: Institution): Observable<Institution> {
    return this.http.post<Institution>(this.BASE_URL, dto);
  }

  update(uuid: string, dto: Institution): Observable<Institution> {
    return this.http.put<Institution>(`${this.BASE_URL}/${uuid}`, { ...dto, uuid });
  }

  delete(uuid: string): Observable<Institution> {
    return this.http.delete<Institution>(`${this.BASE_URL}/${uuid}`);
  }
}
