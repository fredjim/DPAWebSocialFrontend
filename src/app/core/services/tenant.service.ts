import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
/**
 * Solo resolver el slug desde la URL
 */
export class TenantService {

  // Rutas de Angular que NO son slugs de tenant
  private readonly RESERVED_PATHS = ['profile', 'institution', 'login', 'register', 'admin'];
  private currentSlug: string | null = null;

  // Llamado por el guard, fuente autoritativa (route.paramMap)
  setSlug(slug: string): void {
    this.currentSlug = slug;
  }

  /**
   * Devuelve el slug del tenant activo leyendo el primer segmento del path de la URL.
   * Ejemplo: app.umss.net/dpa/posts → "dpa"
   * Fallback en desarrollo: environment.DEFAULT_TENANT_SLUG
   */
  getSlug(): string {
    
    if (this.currentSlug) {
      return this.currentSlug;
    }

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
}
