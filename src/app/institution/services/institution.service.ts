import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UploadedMedia } from "../../shared/models/uploaded-media";
import { Institution } from "../../shared/models/institution";
import { MediaInstitution } from "../../shared/models/media-institution";
import { PaginatedResponse } from "../../shared/models/paginated-response";


@Injectable({
  providedIn: 'root'
})
/**
 * Todas las llamadas HTTP al Backend
 */
export class InstitutionService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly institutionUrl: string = 'institutions';

  constructor(
    private readonly http: HttpClient
  ) {}

  getInstitutionByUuid(uuid: string): Observable<Institution> {
    return this.http.get<Institution>(`${this.ROOT_URL}/${this.institutionUrl}/${uuid}`);
  }

  /**
   * Devuelve el Observable de la institución activa del slug de la URL.
   * Llama a GET /institutions/current (el backend usa el header X-Tenant-Slug para resolverla).
   */
  getCurrentTenantInstitution(): Observable<Institution> {
    return this.http.get<Institution>(`${this.ROOT_URL}/${this.institutionUrl}/current`);
  }

  postInstitutionPhotoProfile(formData: FormData): Observable<UploadedMedia> {
    const url = `${this.ROOT_URL}/images/inst-profile`;
    return this.http.post<UploadedMedia>(url, formData);
  }

  postInstitutionPhotoCover(formData: FormData): Observable<UploadedMedia> {
    const url = `${this.ROOT_URL}/images/inst-cover`;
    return this.http.post<UploadedMedia>(url, formData);
  }

  updateInstitutionData(body: Partial<Institution>): Observable<Institution> {
    const url = `${this.ROOT_URL}/${this.institutionUrl}`;
    return this.http.put<Institution>(url, body);
  }

  //Obtener las fotos paginadas de la institucion
  getInstitutionPhotos(uuid: string, page = 0, size = 12, sort = 'post_date,desc'): Observable<PaginatedResponse<MediaInstitution>> {
    const url = `${this.ROOT_URL}/institutions/${uuid}/photos`;
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PaginatedResponse<MediaInstitution>>(url, { params });
  }

  //Obtener los videos paginados de la institucion
  getInstitutionVideos(uuid: string, page = 0, size = 9, sort = 'post_date,desc'): Observable<PaginatedResponse<MediaInstitution>> {
    const url = `${this.ROOT_URL}/institutions/${uuid}/videos`;
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PaginatedResponse<MediaInstitution>>(url, { params });
  }

  //Obtener los documentos paginados de la institucion
  getInstitutionDocuments(uuid: string, page = 0, size = 20, sort = 'post_date,desc'): Observable<PaginatedResponse<MediaInstitution>> {
    const url = `${this.ROOT_URL}/institutions/${uuid}/documents`;
    const params = new HttpParams().set('page', page).set('size', size).set('sort', sort);
    return this.http.get<PaginatedResponse<MediaInstitution>>(url, { params });
  }
}