import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "../../authentication/services/auth.service";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UploadedMedia } from "../../posts/models/uploaded-media";
import { Institution } from "../../posts/models/institution";


@Injectable({
  providedIn: 'root'
})
export class InstitutionService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

  postInstitutionPhotoProfile(formData: FormData): Observable<UploadedMedia[]> {
    const url = `${this.ROOT_URL}/images/inst-profile`;
    return this.http.post<UploadedMedia[]>(url, formData, this.reqHeader);
  }

  postInstitutionPhotoCover(formData: FormData): Observable<UploadedMedia[]> {
    const url = `${this.ROOT_URL}/images/inst-cover`;
    return this.http.post<UploadedMedia[]>(url, formData, this.reqHeader);
  }

  updateInstitutionData(updateInstitution: Institution): Observable<Institution> {
    const institutionId = this.authService.getInstitutionId();
    const url = `${this.ROOT_URL}/institutions/${institutionId}`;
    return this.http.put<Institution>(url, updateInstitution, this.reqHeader);
  }
}