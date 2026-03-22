import { Routes } from '@angular/router';
import { AuthGuard } from '../features/auth/guards/auth.guard';
import { AdminGuard } from '../features/auth/guards/admin.guard';

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
    path: 'admin',
    loadComponent: () =>
      import('../features/admin/pages/admin/admin').then(m => m.Admin),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/classes',
    loadComponent: () =>
      import('../features/admin/pages/classes/classes').then(m => m.AdminClasses),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/teachers',
    loadComponent: () =>
      import('../features/admin/pages/teachers/teachers').then(m => m.AdminTeachers),
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/members',
    loadComponent: () =>
      import('../features/admin/pages/members/members').then(m => m.AdminMembers),
    canActivate: [AdminGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
