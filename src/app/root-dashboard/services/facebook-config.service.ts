import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FacebookConfig, SaveFacebookConfigDTO } from '../models/facebook-config.model';

@Injectable({ providedIn: 'root' })
export class FacebookConfigService {

  private readonly BASE_URL = `${environment.BACK_END_HOST_DEV}/institutions`;

  constructor(private readonly http: HttpClient) {}

  get(institutionUuid: string): Observable<FacebookConfig> {
    return this.http.get<FacebookConfig>(`${this.BASE_URL}/${institutionUuid}/facebook-config`);
  }

  save(institutionUuid: string, dto: SaveFacebookConfigDTO): Observable<FacebookConfig> {
    return this.http.post<FacebookConfig>(`${this.BASE_URL}/${institutionUuid}/facebook-config`, dto);
  }

  disable(institutionUuid: string): Observable<FacebookConfig> {
    return this.http.patch<FacebookConfig>(`${this.BASE_URL}/${institutionUuid}/facebook-config/disable`, {});
  }

  delete(institutionUuid: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${institutionUuid}/facebook-config`);
  }
}
