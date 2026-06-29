import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../authentication/services/auth.service';

@Injectable({ providedIn: 'root' })
export class RootAuthService {

  private readonly AUTH_URL = environment.BACK_END_HOST_DEV_AUTH;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  rootLogin(email: string, password: string): Observable<void> {
    localStorage.removeItem('isRootSession');

    return this.http.post<any>(`${this.AUTH_URL}/root/login`, { email, password }, {
      withCredentials: true
    }).pipe(
      map(res => {
        this.authService.token = res.accessToken;
        // refreshToken llega como cookie HttpOnly — el browser lo almacena solo
        localStorage.setItem('isRootSession', 'true');
      })
    );
  }

  rootLogout(): void {
    this.authService.token = null;
    localStorage.removeItem('isRootSession');

    // El browser envía la cookie refresh_token automáticamente
    // El backend la revoca y responde borrando la cookie (Max-Age=0)
    this.http.post(`${this.AUTH_URL}/logout`, {}, { withCredentials: true }).subscribe();

    this.router.navigate(['/root/login']);
  }

  isRootFromToken(): boolean {
    const token = this.authService.token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.isRoot === true;
    } catch {
      return false;
    }
  }
}
