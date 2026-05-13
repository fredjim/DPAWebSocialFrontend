import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const rootGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (!token) return router.createUrlTree(['/root/login']);

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.isRoot === true ? true : router.createUrlTree(['/root/login']);
  } catch {
    return router.createUrlTree(['/root/login']);
  }
};
