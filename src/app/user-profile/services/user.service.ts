import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthService } from "../../authentication/services/auth.service";
import { environment } from "../../../environments/environment";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class InformationService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;

  private readonly reqHeader = { headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() }) };

  private readonly insitutionUuid: string = '93j203b4-f63b-4c4a-be05-eae84cef0c0c';

  constructor(
    private readonly http: HttpClient, 
    private readonly authService: AuthService
  ) {}

//   updateUserProfilePhoto(userUuid: string, photoPath: string) {}
}