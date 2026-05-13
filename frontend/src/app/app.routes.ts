import { Routes } from '@angular/router';
import { DashboardComponent } from './features/admin-panel/admin-panel';
import { AnunciosComponent } from './features/anuncios/anuncios';
import { LoginComponent } from './features/login/login';
import { authGuard, publicGuard } from './core/guards/auth.guard';

import { Signup } from './features/signup/signup';
import { MiembrosComponent } from './features/miembros/miembros';
import { AdminClasesComponent } from './features/admin-class/admin-class';
import { EventosComponent } from './features/eventos/eventos';
import { PerfilComponent } from './features/perfil/perfil';
import { HorariosComponent } from './features/horarios/horarios';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: DashboardComponent,
  },
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
    path: 'home',
    redirectTo: '/panel-admin',
    pathMatch: 'full',
  },
  {
    path: 'reservas',
    redirectTo: '/horarios',
    pathMatch: 'full',
  },
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard],
  },
  {
    path: 'horarios',
    component: HorariosComponent,
    canActivate: [authGuard],
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
    path: 'miembros',
    component: MiembrosComponent,
    canActivate: [authGuard],
  },
  {
    path: 'eventos',
    component: EventosComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
