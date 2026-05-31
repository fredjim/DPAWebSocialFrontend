import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { Institution } from '../posts/models/institution';

@Injectable({
  providedIn: 'root'
})
export class TenantService {

  private institution$: Observable<Institution> | null = null;

  constructor(private readonly http: HttpClient) {}

  /**
   * Devuelve el slug del tenant activo.
   *
   * Orden de resolución:
   *   1. Dev override — localStorage 'dev_tenant' (solo en !production)
   *   2. Subdominio del hostname — dpa.umss.net → "dpa"
   *   3. Fallback — environment.DEFAULT_TENANT_SLUG (dev local sin subdominio)
   */
  getSlug(): string {
    // Override local para desarrollo — establecer con:
    //   localStorage.setItem('dev_tenant', 'dpa')  en la consola del navegador
    if (!environment.production) {
      const devTenant = localStorage.getItem('dev_tenant');
      if (devTenant) return devTenant;
    }

    const hostname = window.location.hostname; // "dpa.umss.net"
    const parts = hostname.split('.');

    // Root dashboard nunca pertenece a un tenant
    if (parts[0] === 'root') return '';

    // Subdominio real: dpa.umss.net (3 partes) o dpa.localhost (2 partes en dev)
    const EXCLUDED_HOSTS = ['www', 'app', 'api', 'root', 'localhost'];
    const isSubdomain =
      (!EXCLUDED_HOSTS.includes(parts[0])) &&
      (parts.length >= 3 || (parts.length === 2 && parts[1] === 'localhost'));

    if (isSubdomain) {
      return parts[0];
    }

    // Fallback para desarrollo local sin subdominio
    return environment.DEFAULT_TENANT_SLUG ?? '';
  }

  /**
   * Devuelve el Observable de la institución activa.
   * Llama a GET /institutions/current (el backend usa el header X-Tenant-Slug para resolverla).
   * El resultado se cachea con shareReplay(1) durante la vida de la sesión.
   */
  getInstitution(): Observable<Institution> {
    if (!this.institution$) {
      this.institution$ = this.http
        .get<Institution>(`${environment.BACK_END_HOST}/institutions/current`)
        .pipe(shareReplay(1));
    }
    return this.institution$;
  }

  /**
   * Limpia el caché de institución. Útil si el tenant cambia (ej. navegación cross-tenant).
   */
  clearCache(): void {
    this.institution$ = null;
  }
}
