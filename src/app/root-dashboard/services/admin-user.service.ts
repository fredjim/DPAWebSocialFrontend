import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, CreateAdminUserDTO } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {

  private readonly BASE_URL = `${environment.BACK_END_HOST_DEV}/users`;
  private readonly ADMIN_ROLE_ID = 2;

  constructor(private readonly http: HttpClient) {}

  getByInstitution(institutionId: string): Observable<AdminUser[]> {
    const params = new HttpParams().set('institutionId', institutionId);
    return this.http.get<AdminUser[]>(`${this.BASE_URL}/admin`, { params });
  }

  create(dto: Omit<CreateAdminUserDTO, 'roleId'>): Observable<AdminUser> {
    const payload: CreateAdminUserDTO = { ...dto, roleId: this.ADMIN_ROLE_ID };
    return this.http.post<AdminUser>(this.BASE_URL, payload);
  }

  update(uuid: string, dto: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.BASE_URL}/admin/${uuid}`, dto);
  }

  delete(uuid: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.BASE_URL}/admin/${uuid}`);
  }
}
