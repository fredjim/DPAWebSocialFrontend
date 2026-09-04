import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantInstitutionStateService } from '../services/tenant-institution-state.service';
import { TenantService } from '../services/tenant.service';

export const tenantGuard: CanActivateFn = (route, state) => {
  const tenantInstitutionStateService = inject(TenantInstitutionStateService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (!tenantService.getSlug()) {
    return router.createUrlTree(['/not-found']);
  }

  return tenantInstitutionStateService.loadCurrentTenantInstitution().pipe(
    map(() => true),
    catchError(() => {
      tenantInstitutionStateService.clear();
      return of(router.createUrlTree(['/not-found']));
    })
  );
};