import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home-page/home-page';
import { DashboardComponent } from './features/admin-panel/admin-panel';
import { AnunciosComponent } from './features/anuncios/anuncios';
import { LoginComponent } from './features/login/login';
import { authGuard, publicGuard } from './core/guards/auth.guard';

// 1. Importamos el nuevo componente que hemos creado
// ⚠️ Ojo: asegúrate de que esta ruta coincida con la carpeta donde guardaste los archivos de signup
import { Signup } from './features/signup/signup';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  // 2. Añadimos el nuevo bloque para la ruta de registro
  {
    path: 'signup',
    component: Signup,
    canActivate: [publicGuard]
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomePageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'reservas',
    component: HomePageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'perfil',
    component: HomePageComponent,
    canActivate: [authGuard]
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
