import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Institution } from '../../shared/models/institution';

@Injectable({
  providedIn: 'root'
})
export class TenantService {

  private institution$: Observable<Institution> | null = null;

  // Rutas de Angular que NO son slugs de tenant
  private readonly RESERVED_PATHS = ['profile', 'institution', 'login', 'register', 'admin'];

  constructor(private readonly http: HttpClient) {}

  /**
   * Devuelve el slug del tenant activo leyendo el primer segmento del path de la URL.
   * Ejemplo: app.umss.net/dpa/posts → "dpa"
   * Fallback en desarrollo: environment.DEFAULT_TENANT_SLUG
   */
  getSlug(): string {
    const segments = globalThis.location.pathname
      .split('/')
      .filter(s => s.length > 0);

    const firstSegment = segments[0] ?? '';

    // Root dashboard never belongs to a tenant
    if (firstSegment === 'root') return '';

    if (firstSegment && !this.RESERVED_PATHS.includes(firstSegment)) {
      return firstSegment;
    }

    return environment.DEFAULT_TENANT_SLUG ?? '';
  }

  /**
   * Devuelve el Observable de la institución activa.
   * Llama a GET /institutions/current (el backend usa el header X-Tenant-Slug para resolverla).
   * El resultado se cachea con shareReplay(1) durante la vida de la sesión.
   */
  getInstitution(): Observable<Institution> {
    this.institution$ ??= this.http
      .get<Institution>(`${environment.BACK_END_HOST_DEV}/institutions/current`)
      .pipe(shareReplay(1));
    
    return this.institution$;
  }

  /**
   * Limpia el caché de institución. Útil si el tenant cambia (ej. navegación cross-tenant).
   */
  clearCache(): void {
    this.institution$ = null;
  }
}
