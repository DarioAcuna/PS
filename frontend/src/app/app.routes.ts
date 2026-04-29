import { Routes } from '@angular/router';
import { DashboardComponent } from './features/admin-panel/admin-panel';
import { AnunciosComponent } from './features/anuncios/anuncios';
import { LoginComponent } from './features/login/login';
import { authGuard, publicGuard } from './core/guards/auth.guard';

import { Signup } from './features/signup/signup';

export const routes: Routes = [
  // Ruta raíz: verificar autenticación y redirigir
  {
    path: '',
    canActivate: [authGuard],
    component: DashboardComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'signup',
    component: Signup,
    canActivate: [publicGuard]
  },
  {
    path: 'home',
    redirectTo: '/panel-admin',
    pathMatch: 'full'
  },
  {
    path: 'reservas',
    redirectTo: '/panel-admin',
    pathMatch: 'full'
  },
  {
    path: 'perfil',
    redirectTo: '/panel-admin',
    pathMatch: 'full'
  },
  {
    path: 'panel-admin',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'anuncios',
    component: AnunciosComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/login'
  },
];
