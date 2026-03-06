import { Routes } from '@angular/router';
import { AuthGuard } from '../features/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../features/auth/pages/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('../features/home/pages/home/home').then(m => m.Home),
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
