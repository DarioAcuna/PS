import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { FooterComponent } from '../../shared/admin-footer/admin-footer';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { SesionesService } from '../../services/sesiones/sesiones.service';
import { SesionDetallada } from '../../services/sesiones/sesiones.models';
import { AuthService } from '../../services/auth/auth.service';
import { UsuariosService } from '../../services/usuarios/usuarios.service';
import { Usuario } from '../../services/usuarios/usuarios.models';
import { EventosService } from '../../services/eventos/eventos.service';
import { Evento } from '../../services/eventos/eventos.models';

type DashboardTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

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
  private readonly usuariosService = inject(UsuariosService);
  private readonly eventosService = inject(EventosService);

  selectedTab: DashboardTab = 'dashboard';

  navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  activeMembers = '0';
  weeklyClasses = '0';
  nextEvent = 'Sin eventos';

  scheduledClasses: DashboardItem[] = [];
  loadingScheduledClasses = false;
  scheduledClassesError = '';

  newMembers: DashboardItem[] = [];
  loadingNewMembers = false;
  newMembersError = '';

  upcomingEvents: DashboardItem[] = [];
  loadingUpcomingEvents = false;
  upcomingEventsError = '';

  ngOnInit(): void {
    this.cargarClasesProgramadas();
    this.cargarMiembros();
    this.cargarEventos();
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

  selectTab(tab: string): void {
    this.selectedTab = tab as DashboardTab;

    switch (tab) {
      case 'dashboard':
        void this.router.navigate(['/panel-admin']);
        break;

      case 'clases':
        void this.router.navigate(['/clases']);
        break;

      case 'miembros':
        void this.router.navigate(['/miembros']);
        break;

      case 'eventos':
        void this.router.navigate(['/eventos']);
        break;

      case 'anuncios':
        void this.router.navigate(['/anuncios']);
        break;

      default:
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

  private cargarMiembros(): void {
    this.loadingNewMembers = true;
    this.newMembersError = '';

    this.usuariosService
      .findAll()
      .pipe(
        finalize(() => {
          this.loadingNewMembers = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (usuarios: Usuario[]) => {
          const usuariosSeguros = Array.isArray(usuarios) ? usuarios : [];

          this.activeMembers = usuariosSeguros
            .filter((usuario) => usuario.status === 'ACTIVO')
            .length
            .toString();

          this.newMembers = usuariosSeguros
            .slice()
            .sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .slice(0, 5)
            .map((usuario) => {
              const fullName = `${usuario.firstName ?? ''} ${usuario.lastName ?? ''}`.trim();

              return {
                name: usuario.name || fullName || 'Miembro',
                date: this.buildMemberSince(usuario.createdAt),
              };
            });
        },
        error: () => {
          this.activeMembers = '0';
          this.newMembers = [];
          this.newMembersError = 'No se pudieron cargar los miembros recientes.';
        },
      });
  }

  private cargarEventos(): void {
    this.loadingUpcomingEvents = true;
    this.upcomingEventsError = '';
    this.cdr.detectChanges();

    this.eventosService
      .findAll()
      .pipe(
        finalize(() => {
          this.loadingUpcomingEvents = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (eventos: Evento[]) => {
          const eventosSeguros = Array.isArray(eventos) ? eventos : [];
          const today = this.getStartOfToday();
          const proximosEventos = eventosSeguros
            .filter((evento) => this.getEventDate(evento).getTime() >= today.getTime())
            .sort(
              (a, b) => this.getEventDate(a).getTime() - this.getEventDate(b).getTime(),
            );

          this.nextEvent = proximosEventos[0]?.name ?? 'Sin eventos';
          this.upcomingEvents = proximosEventos
            .slice(0, 5)
            .map((evento) => this.mapEventoToDashboardItem(evento));
        },
        error: (error) => {
          console.error('Error al cargar eventos:', error);
          this.nextEvent = 'Sin eventos';
          this.upcomingEvents = [];
          this.upcomingEventsError = 'No se pudieron cargar los eventos.';
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
    const currentDay = now.getDay();
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

    return formattedDate || 'Horario no disponible';
  }

  private mapEventoToDashboardItem(evento: Evento): DashboardItem {
    return {
      name: evento.name,
      date: this.formatEventDate(evento.eventDate),
    };
  }

  private getEventDate(evento: Evento): Date {
    const datePart = String(evento.eventDate ?? '').split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private formatEventDate(value: string): string {
    const datePart = String(value ?? '').split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }

  private buildMemberSince(createdAt: string): string {
    const createdDate = new Date(createdAt);

    if (Number.isNaN(createdDate.getTime())) {
      return 'Fecha no disponible';
    }

    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return 'Hoy';
    }

    if (diffDays === 1) {
      return 'Hace 1 dia';
    }

    return `Hace ${diffDays} dias`;
  }
}
