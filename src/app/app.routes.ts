import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../features/auth/pages/login/login').then(m => m.LoginComponent),
  },
];
