import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  const permissions = route.data['permissions'] as string[] | undefined;
  const roles = route.data['roles'] as string[] | undefined;

  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (roles?.length && !roles.some((role) => auth.hasRole(role))) return router.createUrlTree(['/']);
  if (permissions?.length && !auth.hasAnyPermission(permissions)) return router.createUrlTree(['/']);
  return true;
};
