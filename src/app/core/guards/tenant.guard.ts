import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantService } from '../services/tenant.service';
import { AuthService } from '../../authentication/services/auth.service';
import { UserStateService } from '../services/user-state.service';

export const tenantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const userState = inject(UserStateService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  const urlSlug = route.paramMap.get('slug');

  if (authService.isAuthenticated()) {
    const ownSlug = userState.getOwnInstitutionSlugSnapshot();

    if (ownSlug && urlSlug !== ownSlug) {
      const remainingSegments = state.url.split('/').filter(s => s.length > 0).slice(1);
      return of(router.createUrlTree(['/', ownSlug, ...remainingSegments]));
    }
  }

  return tenantService.getInstitution().pipe(
    map(() => true),
    catchError(() => {
      tenantService.clearCache();
      return of(router.createUrlTree(['/not-found']));
    })
  );
};