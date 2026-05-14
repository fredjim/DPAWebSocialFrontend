import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RootAuthService {

  private readonly AUTH_URL = environment.BACK_END_HOST_DEV_AUTH;

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  rootLogin(email: string, password: string): Observable<void> {
    // Clear any existing session before logging in as ROOT
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isRootSession');

    return this.http.post<any>(`${this.AUTH_URL}/root/login`, { email, password }).pipe(
      map(res => {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('isRootSession', 'true');
      })
    );
  }

  rootLogout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isRootSession');

    if (refreshToken) {
      this.http.post(`${this.AUTH_URL}/logout`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      }).subscribe();
    }

    this.router.navigate(['/root/login']);
  }

  isRootFromToken(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.isRoot === true;
    } catch {
      return false;
    }
  }
}
