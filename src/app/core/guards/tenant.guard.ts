import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TenantInstitutionStateService } from '../services/tenant-institution-state.service';
import { TenantService } from '../services/tenant.service';
import { OwnInstitutionStateService } from '../services/own-institution-state.service';
import { AuthService } from '../../authentication/services/auth.service';
import { environment } from '../../../environments/environment';

export const tenantGuard: CanActivateFn = (route, state) => {
  const tenantInstitutionStateService = inject(TenantInstitutionStateService);
  const authService = inject(AuthService);
  const ownInstitutionStateService = inject(OwnInstitutionStateService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  const urlSlug = tenantService.getSlug(); //subdomian

  if (authService.isAuthenticated()) {
    const ownSlug = ownInstitutionStateService.getOwnInstitutionSlugSnapshot();

    if (ownSlug && urlSlug !== ownSlug) {

      if (!environment.production) {
        localStorage.setItem('dev_tenant', ownSlug);
      }else{
        // Redirige a la raíz del subdominio correcto
        const hostname = window.location.hostname; // "dpa.umss.edu.bo"
        const dominio = hostname.substring(hostname.indexOf('.')); // ".umss.edu.bo"
        const newUrl = `//${ownSlug}${dominio}/`;
        window.location.replace(newUrl);
      }
    }
  }

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