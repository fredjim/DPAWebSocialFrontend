import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "../../authentication/services/auth.service";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UploadedMedia } from "../../posts/models/uploaded-media";
import { UserDetail } from "../../posts/models/user-detail";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

  // Update data user
  updateUserDate(updatedUser: UserDetail): Observable<UserDetail> {
    const url = `${this.ROOT_URL}/users/me`;
    return this.http.put<UserDetail>(url, updatedUser, this.reqHeader);
  }

  // Update photo user profile
  postUserPhotoProfile(formData: FormData): Observable<UploadedMedia[]> {
    const url = `${this.ROOT_URL}/images/user-profile`;
    return this.http.post<UploadedMedia[]>(url, formData, this.reqHeader);
  }
}