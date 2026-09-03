import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../authentication/services/auth.service';
import { OwnInstitutionStateService } from '../services/own-institution-state.service';
import { TenantInstitutionStateService } from '../services/tenant-institution-state.service';
import { TenantService } from '../services/tenant.service';

export const tenantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const ownInstitutionStateService = inject(OwnInstitutionStateService);
  const tenantInstitutionStateService = inject(TenantInstitutionStateService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  const urlSlug = route.paramMap.get('slug');

  if (authService.isAuthenticated()) {
    const ownSlug = ownInstitutionStateService.getOwnInstitutionSlugSnapshot();

    if (ownSlug && urlSlug !== ownSlug) {
      const remainingSegments = state.url.split('/').filter(s => s.length > 0).slice(1);
      return of(router.createUrlTree(['/', ownSlug, ...remainingSegments]));
    }
  }

  if (urlSlug) {
    tenantService.setSlug(urlSlug); //fija el slug ANTES de la petición
  }

  return tenantInstitutionStateService.loadCurrentTenantInstitution().pipe(
    map(() => true),
    catchError(() => {
      tenantInstitutionStateService.clear();
      return of(router.createUrlTree(['/not-found']));
    })
  );
};