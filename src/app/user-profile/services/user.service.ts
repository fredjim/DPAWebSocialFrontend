import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "../../authentication/services/auth.service";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UploadedMedia } from "../../shared/models/uploaded-media";
import { UserDetail } from "../../shared/models/user-detail";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  private readonly userUrl: string = 'users/me';

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

  //Método para obtener el user logueado
  getUser(): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${this.ROOT_URL}/${this.userUrl}`, this.reqHeader)
  }

  updateUserDate(body: Partial<UserDetail>): Observable<UserDetail> {
    return this.http.put<UserDetail>(`${this.ROOT_URL}/${this.userUrl}`, body, this.reqHeader);
  }

  postUserPhotoProfile(formData: FormData): Observable<UploadedMedia> {
    const url = `${this.ROOT_URL}/images/user-profile`;
    return this.http.post<UploadedMedia>(url, formData, this.reqHeader);
  }

  deleteUserPhotoProfile(imgUuid: string): Observable<void> {
    return this.http.delete<void>(`${this.ROOT_URL}/images/${imgUuid}`, this.reqHeader);
  }
}