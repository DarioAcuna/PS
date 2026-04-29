import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { FooterComponent } from '../../shared/admin-footer/admin-footer';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { SesionesService } from '../../services/sesiones/sesiones.service';
import { SesionDetallada } from '../../services/sesiones/sesiones.models';
import { AuthService } from '../../services/auth/auth.service';

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
  imports: [CommonModule, FooterComponent, AdminHeaderComponent],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class DashboardComponent implements OnInit {
  private readonly sesionesService = inject(SesionesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

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
  weeklyClasses = '0';
  nextEvent = 'Torneo grappling';

  scheduledClasses: DashboardItem[] = [];
  loadingScheduledClasses = false;
  scheduledClassesError = '';

  newMembers: DashboardItem[] = [
    { name: 'Carlos Perez', date: 'Desde hace 2 días' },
    { name: 'Lucía Martín', date: 'Desde hace 3 días' },
    { name: 'Alejandro Suárez', date: 'Desde hace 5 días' },
  ];

  upcomingEvents: DashboardItem[] = [
    { name: 'Seminario BJJ', date: '22 Sep 2026' },
    { name: 'Open Mat Especial', date: '29 Sep 2026' },
  ];

  ngOnInit(): void {
    this.cargarClasesProgramadas();
  }

  cargarClasesProgramadas(): void {
    this.loadingScheduledClasses = true;
    this.scheduledClassesError = '';
    this.cdr.detectChanges();

    this.sesionesService
      .findAll()
      .pipe(
        finalize(() => {
          this.loadingScheduledClasses = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (sesiones: SesionDetallada[]) => {
          const sesionesSeguras = Array.isArray(sesiones) ? sesiones : [];

          this.weeklyClasses = this.getWeeklyClassesCount(sesionesSeguras).toString();

          this.scheduledClasses = sesionesSeguras
            .filter((sesion) => this.isUpcomingSession(sesion))
            .sort(
              (a, b) => this.getSessionDateTime(a).getTime() - this.getSessionDateTime(b).getTime(),
            )
            .map((sesion) => this.mapSesionToDashboardItem(sesion))
            .slice(0, 5);

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar sesiones:', error);
          this.scheduledClassesError = 'No se pudieron cargar las clases programadas.';
          this.scheduledClasses = [];
          this.weeklyClasses = '0';
          this.cdr.detectChanges();
        },
      });
  }

  private getWeeklyClassesCount(sesiones: SesionDetallada[]): number {
    const { startOfWeek, endOfWeek } = this.getCurrentWeekRange();

    return sesiones.filter((sesion) => {
      const sessionDate = this.getSessionDateTime(sesion);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    }).length;
  }

  private getCurrentWeekRange(): { startOfWeek: Date; endOfWeek: Date } {
    const now = new Date();
    const currentDay = now.getDay(); // domingo=0, lunes=1, ..., sábado=6
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  private isUpcomingSession(sesion: SesionDetallada): boolean {
    const sessionDateTime = this.getSessionDateTime(sesion);
    return sessionDateTime.getTime() >= new Date().getTime();
  }

  private getSessionDateTime(sesion: SesionDetallada): Date {
    const s = sesion as any;

    const rawDate = s?.date;
    const rawStartTime = s?.startTime;

    if (!rawDate || !rawStartTime) {
      return new Date(0);
    }

    const datePart = String(rawDate).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = String(rawStartTime).split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes || 0, 0, 0);
  }

  private mapSesionToDashboardItem(sesion: SesionDetallada): DashboardItem {
    const s = sesion as any;

    const className = s?.schedule?.class?.name || s?.schedule?.class?.nombre || 'Clase';

    return {
      name: className,
      date: this.buildSesionSubtitle(s),
    };
  }

  private buildSesionSubtitle(sesion: any): string {
    const rawDate = sesion?.date || '';
    const startTime = sesion?.startTime || '';
    const endTime = sesion?.endTime || '';

    let formattedDate = '';

    if (rawDate) {
      const parsedDate = new Date(rawDate);

      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }

    if (formattedDate && startTime && endTime) {
      return `${formattedDate}, ${startTime} - ${endTime}`;
    }

    if (formattedDate && startTime) {
      return `${formattedDate}, ${startTime}`;
    }

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    if (formattedDate) {
      return formattedDate;
    }

    return 'Horario no disponible';
  }

  selectTab(tab: string): void {
    this.selectedTab = tab as DashboardTab;

    switch (tab) {
      case 'dashboard':
        void this.router.navigate(['/panel-admin']);
        break;
      case 'anuncios':
        void this.router.navigate(['/anuncios']);
        break;
      default:
        // Secciones no implementadas aun.
        void this.router.navigate(['/panel-admin']);
        break;
    }
  }

  goToHome(): void {
    void this.router.navigate(['/panel-admin']);
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(take(1))
      .subscribe({
        next: () => {
          void this.router.navigate(['/login']);
        },
        error: () => {
          this.authService.clearAll();
          void this.router.navigate(['/login']);
        },
      });
  }
}
