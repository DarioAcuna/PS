import { Routes } from '@angular/router';
import { DashboardComponent } from './features/admin-panel/admin-panel';
import { AnunciosComponent } from './features/anuncios/anuncios';
import { LoginComponent } from './features/login/login';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { Signup } from './features/signup/signup';
import { AdminClasesComponent } from './features/admin-class/admin-class';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard],
  },
  {
    path: 'signup',
    component: Signup,
    canActivate: [publicGuard],
  },
  {
    path: '',
    redirectTo: '/panel-admin',
    pathMatch: 'full',
  },
  {
    path: 'home',
    redirectTo: '/panel-admin',
    pathMatch: 'full',
  },
  {
    path: 'reservas',
    redirectTo: '/panel-admin',
    pathMatch: 'full',
  },
  {
    path: 'perfil',
    redirectTo: '/panel-admin',
    pathMatch: 'full',
  },
  {
    path: 'panel-admin',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'clases',
    component: AdminClasesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'anuncios',
    component: AnunciosComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
