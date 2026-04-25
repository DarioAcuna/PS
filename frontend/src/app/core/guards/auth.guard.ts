import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Guard para rutas que requieren autenticación
 * Redirige a /login si no está autenticado
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir a login si no está autenticado
  router.navigate(['/login']);
  return false;
};

/**
 * Guard para rutas públicas (login)
 * Redirige a panel-admin si ya está autenticado
 */
export const publicGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir al panel admin
  if (authService.isAuthenticated()) {
    router.navigate(['/panel-admin']);
    return false;
  }

  return true;
};

