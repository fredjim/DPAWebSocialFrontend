import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import { NewUser } from '../models/new-user';
import { JwtHelperService } from '@auth0/angular-jwt';
import { TenantService } from '../../core/services/tenant.service';
import { OwnInstitutionStateService } from '../../core/services/own-institution-state.service';
import { firstValueFrom, forkJoin, from, Observable, of } from 'rxjs';
import { UserStateService } from '../../core/services/user-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV_AUTH}`;
  private readonly jwtHelper = new JwtHelperService();


  public token: string | null = null;
  constructor(
    private readonly http: HttpClient,
    private readonly tenantService: TenantService,
    private readonly institutionStateService: OwnInstitutionStateService,
    private readonly userStateService: UserStateService
  ) {
  }

  isAuthenticated(): boolean {
    if (!this.token) return false;
    return !this.jwtHelper.isTokenExpired(this.token);
  }

  login(username: string, password: string): Observable<boolean> {
    const user = { email: username, password };
    return this.http.post<{ accessToken: string, tokenType: string }>(this.ROOT_URL + '/login', user, { withCredentials: true }).pipe(
      switchMap(res => {
        this.token = res.accessToken;
        // refreshToken llega como cookie HttpOnly — el browser lo almacena solo
        return from(this.ensureSessionStateLoaded()).pipe(map(() => true));
      })
    );
  }

  register(newUser: NewUser) {
    return this.http.post<{ message: string }>(this.ROOT_URL + '/register', newUser);
  }

  verifyEmail(token: string) {
    return this.http.get<{ message: string }>(`${this.ROOT_URL}/verify-email`, { params: { token } });
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.ROOT_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.ROOT_URL}/reset-password`, { token, newPassword });
  }

  getToken() {
    return this.token;
  }

  getUsername() {
    return localStorage.getItem('username');
  }

  getUserId() {
    if (!this.token) return null;
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.userId ?? null;
    } catch (error) {
      console.error("Error al decodificar el token:", error);
      return null;
    }
  }

  getInstitutionId(): string | null {
    if (!this.token) return null;
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.institutionId ?? null;
    } catch {
      return null;
    }
  }

  getRoles() {
    if (!this.token) return [];
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
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

  tokenHasExpired() {
    let convertDate = Number.parseInt(localStorage.getItem('expires') ?? '') * 1000;
    let expireDate = new Date(convertDate);
    let currentDate = new Date();
    const expired = currentDate > expireDate;
    return expired;
  }

  isTokenExpired(): boolean {
    if (!this.token) return true;
    return this.jwtHelper.isTokenExpired(this.token);
  }

  logout(): void {
    this.token = null;
    this.institutionStateService.clear();
    this.userStateService.clearUser();

    const redirect = () => {
      globalThis.location.href = `/${this.tenantService.getSlug()}`;
    };

    // El browser envía la cookie refresh_token automáticamente (withCredentials)
    // El backend la revoca en BD y responde borrando la cookie (Max-Age=0)
    this.http.post(`${this.ROOT_URL}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => redirect(),
        error: (error) => {
          console.log('Error al cerrar sesión', error);
          redirect();
        }
      });
  }

  // El browser envía la cookie refresh_token automáticamente (withCredentials)
  refreshAccessToken(): Observable<{ accessToken: string, tokenType: string }> {
    return this.http.post<{ accessToken: string, tokenType: string }>(`${this.ROOT_URL}/refresh`, {}, { withCredentials: true });
  }

  // Refresca el token al inicializar la app usando la cookie HttpOnly
  tryRefreshOnStartup(): Promise<void> {
    if (this.token && !this.jwtHelper.isTokenExpired(this.token)) {
      return this.ensureSessionStateLoaded();
    }
    // Si la cookie existe y es válida el backend devuelve un nuevo accessToken
    // Si no hay cookie o expiró, el backend responde 401 y limpiamos memoria
    return firstValueFrom(this.refreshAccessToken()).then((res) => {
      if (res.accessToken) {
        this.token = res.accessToken;
        return this.ensureSessionStateLoaded();
      }
      return Promise.resolve(); 
    }).catch(() => {
      this.token = null;
    });
  }

  // Carga en paralelo el estado de institución propia y del usuario logueado
  private ensureSessionStateLoaded(): Promise<void> {
    const institutionId = this.getInstitutionId();

    const institution$ = institutionId
      ? this.institutionStateService.loadOwnInstitution(institutionId)
      : of(null);

    return firstValueFrom(
      forkJoin([institution$, this.userStateService.loadUser()])
    ).then(() => void 0);
  }
}
