import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, CreateAdminUserDTO, PaginatedResponse } from '../models/admin-user.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {

  private readonly BASE_URL = `${environment.BACK_END_HOST_DEV}/users`;
  private readonly ADMIN_ROLE_ID = 2;

  constructor(private readonly http: HttpClient) { }

  getByInstitution(
    institutionId: string,
    page: number = 0,
    size: number = 20,
    search: string = '',
    role: string = 'ADMIN',
    enabled?: boolean,
    sort?: string
  ): Observable<PaginatedResponse<AdminUser>> {
    let params = new HttpParams()
      .set('institutionId', institutionId)
      .set('page', page.toString())
      .set('size', size.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (enabled !== undefined) {
      params = params.set('enabled', enabled.toString());
    }
    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<PaginatedResponse<AdminUser>>(this.BASE_URL, { params });
  }

  create(dto: Omit<CreateAdminUserDTO, 'roleId'>): Observable<AdminUser> {
    const payload: CreateAdminUserDTO = { ...dto, roleId: this.ADMIN_ROLE_ID };
    return this.http.post<AdminUser>(this.BASE_URL, payload);
  }

  update(uuid: string, dto: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.BASE_URL}/${uuid}`, dto);
  }

  disable(uuid: string): Observable<any> {
    return this.http.patch<any>(`${this.BASE_URL}/${uuid}/disable`, {});
  }

}
