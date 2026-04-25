import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FooterComponent} from '../../shared/admin-footer/admin-footer';

type DashboardTab = 'dashboard' | 'clases' | 'instructores' | 'miembros' | 'eventos' | 'anuncios';

interface NavItem {
  id: DashboardTab;
  label: string;
}

interface DashboardItem {
  name: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class DashboardComponent {
  constructor(private readonly router: Router) {}

  selectedTab: DashboardTab = 'dashboard';

  navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'instructores', label: 'Instructores' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  activeMembers = '128';
  weeklyClasses = '24';
  nextEvent = 'Torneo grappling';

  scheduledClasses: DashboardItem[] = [
    { name: 'Jiu-Jitsu Avanzado', date: 'Hoy, 18:00' },
    { name: 'Jiu-Jitsu Avanzado', date: 'Hoy, 18:00' },
    { name: 'No-Gi Grappling', date: 'Mañana, 19:00' },
  ];

  newMembers: DashboardItem[] = [
    { name: 'Carlos Perez', date: 'Desde hace 2 días' },
    { name: 'Lucía Martín', date: 'Desde hace 3 días' },
    { name: 'Alejandro Suárez', date: 'Desde hace 5 días' },
  ];

  upcomingEvents: DashboardItem[] = [
    { name: 'Seminario BJJ', date: '22 Sep 2026' },
    { name: 'Open Mat Especial', date: '29 Sep 2026' },
  ];

  selectTab(tab: DashboardTab): void {
    this.selectedTab = tab;
    if (tab === 'dashboard') {
      void this.router.navigate(['/panel-admin']);
      return;
    }

    if (tab === 'anuncios') {
      void this.router.navigate(['/anuncios']);
    }
  }

  goToHome(): void {
    void this.router.navigate(['/']);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    void this.router.navigate(['/']);
  }
}
