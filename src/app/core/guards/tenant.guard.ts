import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantService } from '../services/tenant.service';

export const tenantGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  return tenantService.getInstitution().pipe(
    map(() => true),
    catchError(() => {
      tenantService.clearCache();
      return of(router.createUrlTree(['/dpa']));
    })
  );
};