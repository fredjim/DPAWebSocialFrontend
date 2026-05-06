import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { NewUser } from '../models/new-user';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TenantService } from '../../services/tenant.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV_AUTH}`;
  private readonly jwtHelper = new JwtHelperService();


  public token: any
  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly tenantService: TenantService
  ) {
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    return !this.jwtHelper.isTokenExpired(token);
  }

  login(username: string, password: string) {
    let user = {
      email: username,
      password
    }

    return this.http.post<any>(this.ROOT_URL + '/login', user)
      .pipe(
        map(user => {
          this.token = user.accessToken;
          localStorage.setItem('token', this.token);
          localStorage.setItem('refreshToken', user.refreshToken);

          return true;
        })
      );
  }

  register(newUser: NewUser) {
    return this.http.post<{ message: string }>(this.ROOT_URL + '/register', newUser);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUsername() {
    return localStorage.getItem('username');
  }

  getUserId() {
    const token = this.getToken();

    if (!token) {
      console.warn("⚠️ No hay token en localStorage.");
      return null;
    }

    try {
      // 🔥 Decodificar el token para extraer el userId
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId ?? null;
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  }

  getInstitutionId(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.institutionId ?? null;
    } catch {
      return null;
    }
  }

  getRoles() {
    const token = this.getToken();
    if (!token) return [];
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Extraer roles del array en el payload
      return payload.roles || [];
    } catch (error) {
      console.error("Error al extraer roles del token:", error);
      return [];
    }
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    const roles = this.getRoles();
    return roles.includes(role);
  }

  // Verificar si el usuario puede moderar (ADMIN o MODERATOR)
  canModerate(): boolean {
    return this.hasRole('ADMIN') || this.hasRole('MODERATOR');
  }

  tokenHasExpired() {
    let convertDate = Number.parseInt(localStorage.getItem('expires') ?? '') * 1000;
    let expireDate = new Date(convertDate);
    let currentDate = new Date();
    const expired = currentDate > expireDate;
    return expired;
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      return true;
    }
    const expired = this.jwtHelper.isTokenExpired(token);
    return expired;
  }

  // Logout usando refresh token
  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');

    const redirect = () => {
      globalThis.location.href = `/${this.tenantService.getSlug()}`;
    };
    
    if (refreshToken) {
      this.http.post(`${this.ROOT_URL}/logout`, {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      }).subscribe({
        next: () => redirect(),
        error: (error) => {
          console.log('Error al cerrar sesión', error);
          redirect();
        }
      });
    }else {
      redirect();
    }
  }

  // Método para refrescar el access token
  refreshAccessToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    return this.http.post<any>(`${this.ROOT_URL}/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`
      }
    });
  }

  // Refresca el token antes de inicializar la app
  tryRefreshOnStartup(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token || this.jwtHelper.isTokenExpired(token)) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshObs = this.refreshAccessToken();
        if (refreshObs) {
          return refreshObs.toPromise().then((res: any) => {
            if (res && res.accessToken) {
              localStorage.setItem('token', res.accessToken);
            }
          }).catch(() => {
            this.logout();
          });
        }
      }
    }
    return Promise.resolve();
  }
}
