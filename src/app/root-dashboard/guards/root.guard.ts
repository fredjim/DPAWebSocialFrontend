import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../authentication/services/auth.service';

export const rootGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.token;

  if (!token) return router.createUrlTree(['/root/login']);

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.isRoot === true ? true : router.createUrlTree(['/root/login']);
  } catch {
    return router.createUrlTree(['/root/login']);
  }
};
