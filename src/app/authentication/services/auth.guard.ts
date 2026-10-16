import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { TenantService } from '../../core/services/tenant.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // isAuthenticated() debería incluir la verificación de expiración
  if (authService.isAuthenticated()) {
    // Verificar roles
    if (route.data?.['roles']) {
      const requiredRoles: string[] = route.data['roles'];
      const userRoles = authService.getRoles();
      
      if (!requiredRoles.some(role => userRoles.includes(role))) {
        return router.createUrlTree(['/']);
      }
    }
    return true;
  }

  // No autenticado - redirigir al login
  // authService.logout(); // Limpiar datos vencidos
  return router.createUrlTree(['/'], {
    queryParams: { returnUrl: state.url }
  });
};