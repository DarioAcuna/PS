import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home-page/home-page';
import { DashboardComponent } from './features/admin-panel/admin-panel';
import { AnunciosComponent } from './features/anuncios/anuncios';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'reservas', component: HomePageComponent },
  { path: 'perfil', component: HomePageComponent },
  { path: 'panel-admin', component: DashboardComponent },
  { path: 'anuncios', component: AnunciosComponent },
];
