import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, take } from 'rxjs';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { RoleFooterComponent } from '../../shared/role-footer/role-footer';
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

interface WeekDaySchedule {
  dayValue: number;
  label: string;
  date: Date;
  dateLabel: string;
}

interface GanttTimeSlot {
  label: string;
  minutes: number;
  top: number;
}

interface GanttItem {
  dayValue: number;
  startTime: string;
  endTime: string;
  className: string;
  level: string;
  instructor: string;
  top: number;
  height: number;
  widthPercent: number;
  leftPercent: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RoleFooterComponent, AdminHeaderComponent],
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

  loadingScheduledClasses = false;
  scheduledClassesError = '';

  readonly weekDays = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miercoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sabado' },
    { value: 0, label: 'Domingo' },
  ];
  weekScheduleDays: WeekDaySchedule[] = [];
  ganttTimeSlots: GanttTimeSlot[] = [];
  ganttTotalHeight = 0;
  weekScheduleMonthLabel = '';
  weekScheduleRangeLabel = '';
  private ganttItemsByDay = new Map<number, GanttItem[]>();
  private ganttStartMinutes = 8 * 60;
  private ganttEndMinutes = 20 * 60;
  private scheduleWeekOffset = 0;
  private allSessions: SesionDetallada[] = [];

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
          this.allSessions = sesionesSeguras;

          this.weeklyClasses = this.getWeeklyClassesCount(sesionesSeguras).toString();
          this.buildWeekSchedule();

          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al cargar sesiones:', error);
          this.scheduledClassesError = 'No se pudieron cargar las clases programadas.';
          this.allSessions = [];
          this.buildWeekSchedule();
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

  getGanttItemsForDay(dayValue: number): GanttItem[] {
    return this.ganttItemsByDay.get(dayValue) ?? [];
  }

  previousWeek(): void {
    this.scheduleWeekOffset -= 1;
    this.buildWeekSchedule();
    this.cdr.detectChanges();
  }

  nextWeek(): void {
    this.scheduleWeekOffset += 1;
    this.buildWeekSchedule();
    this.cdr.detectChanges();
  }

  private buildWeekSchedule(): void {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + this.scheduleWeekOffset * 7);
    const weekStart = this.getStartOfWeek(baseDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    this.weekScheduleMonthLabel = this.formatMonthYear(weekStart);
    this.weekScheduleRangeLabel = this.formatWeekRange(weekStart, weekEnd);

    this.weekScheduleDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dayValue = date.getDay();
      const label = this.weekDays.find((day) => day.value === dayValue)?.label ?? '';

      return {
        dayValue,
        label,
        date,
        dateLabel: String(date.getDate()).padStart(2, '0'),
      };
    });

    const weekSessions = this.allSessions.filter((sesion) => {
      const sessionDate = this.getSessionDateTime(sesion);
      return sessionDate.getTime() >= weekStart.getTime() && sessionDate.getTime() <= weekEnd.getTime();
    });

    this.buildGanttLayout(weekSessions);
  }

  private buildGanttLayout(weekSessions: SesionDetallada[]): void {
    const pixelsPerMinute = 2;
    const edgePadding = 12;
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;
    const sessionsByDay = new Map<number, SesionDetallada[]>();

    for (const sesion of weekSessions) {
      const sessionDate = this.getSessionDateTime(sesion);
      const dayValue = sessionDate.getDay();
      const startMinutes = this.timeToMinutes(this.getSessionStartTime(sesion));
      const endMinutes = this.timeToMinutes(this.getSessionEndTime(sesion));

      if (!Number.isNaN(startMinutes) && !Number.isNaN(endMinutes)) {
        minStart = Math.min(minStart, startMinutes);
        maxEnd = Math.max(maxEnd, endMinutes);
      }

      const list = sessionsByDay.get(dayValue) ?? [];
      list.push(sesion);
      sessionsByDay.set(dayValue, list);
    }

    if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) {
      this.ganttStartMinutes = 0;
      this.ganttEndMinutes = 0;
      this.ganttTotalHeight = 0;
      this.ganttTimeSlots = [];
      this.ganttItemsByDay = new Map<number, GanttItem[]>();
      return;
    }

    this.ganttStartMinutes = Math.floor(minStart / 60) * 60;
    this.ganttEndMinutes = Math.ceil(maxEnd / 60) * 60;
    if (this.ganttEndMinutes <= this.ganttStartMinutes) {
      this.ganttEndMinutes = this.ganttStartMinutes + 60;
    }

    this.ganttTotalHeight =
      (this.ganttEndMinutes - this.ganttStartMinutes) * pixelsPerMinute + edgePadding * 2;
    this.ganttTimeSlots = [];

    for (let minutes = this.ganttStartMinutes; minutes <= this.ganttEndMinutes; minutes += 60) {
      const hours = Math.floor(minutes / 60);
      const mins = String(minutes % 60).padStart(2, '0');
      this.ganttTimeSlots.push({
        label: `${String(hours).padStart(2, '0')}:${mins}`,
        minutes,
        top: edgePadding + (minutes - this.ganttStartMinutes) * pixelsPerMinute,
      });
    }

    this.ganttItemsByDay = new Map<number, GanttItem[]>();

    for (const [dayValue, daySessions] of sessionsByDay.entries()) {
      const sorted = [...daySessions].sort(
        (a, b) => this.timeToMinutes(this.getSessionStartTime(a)) - this.timeToMinutes(this.getSessionStartTime(b)),
      );

      const laneEnds: number[] = [];
      const tempItems: Array<GanttItem & { laneIndex: number; startMinutes: number; endMinutes: number }> = [];

      for (const sesion of sorted) {
        const startMinutes = this.timeToMinutes(this.getSessionStartTime(sesion));
        const endMinutes = this.timeToMinutes(this.getSessionEndTime(sesion));
        let laneIndex = laneEnds.findIndex((end) => startMinutes >= end);
        if (laneIndex === -1) {
          laneIndex = laneEnds.length;
          laneEnds.push(endMinutes);
        } else {
          laneEnds[laneIndex] = endMinutes;
        }

        tempItems.push({
          dayValue,
          startTime: this.getSessionStartTime(sesion),
          endTime: this.getSessionEndTime(sesion),
          className: this.getSessionClassName(sesion) || 'Clase',
          level: this.getSessionClassLevel(sesion),
          instructor: this.getSessionInstructor(sesion),
          top: edgePadding + (startMinutes - this.ganttStartMinutes) * pixelsPerMinute,
          height: Math.max((endMinutes - startMinutes) * pixelsPerMinute, 16),
          widthPercent: 100,
          leftPercent: 0,
          laneIndex,
          startMinutes,
          endMinutes,
        });
      }

      this.ganttItemsByDay.set(dayValue, this.normalizeGanttOverlapGroups(tempItems));
    }
  }

  private normalizeGanttOverlapGroups(
    items: Array<GanttItem & { laneIndex: number; startMinutes: number; endMinutes: number }>,
  ): GanttItem[] {
    if (items.length === 0) {
      return [];
    }

    const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
    const groups: Array<typeof sorted> = [];
    let current: typeof sorted = [];
    let currentEnd = Number.NEGATIVE_INFINITY;

    for (const item of sorted) {
      if (current.length === 0 || item.startMinutes < currentEnd) {
        current.push(item);
        currentEnd = Math.max(currentEnd, item.endMinutes);
      } else {
        groups.push(current);
        current = [item];
        currentEnd = item.endMinutes;
      }
    }

    if (current.length > 0) {
      groups.push(current);
    }

    const normalized: GanttItem[] = [];
    for (const group of groups) {
      const laneCount = Math.max(...group.map((item) => item.laneIndex + 1), 1);
      const width = 100 / laneCount;

      for (const item of group) {
        normalized.push({
          dayValue: item.dayValue,
          startTime: item.startTime,
          endTime: item.endTime,
          className: item.className,
          level: item.level,
          instructor: item.instructor,
          top: item.top,
          height: item.height,
          widthPercent: width,
          leftPercent: width * item.laneIndex,
        });
      }
    }

    return normalized;
  }

  private getSessionStartTime(sesion: SesionDetallada): string {
    const s = sesion as any;
    return String(s?.startTime ?? s?.horaInicio ?? s?.inicio ?? '').trim();
  }

  private getSessionEndTime(sesion: SesionDetallada): string {
    const s = sesion as any;
    return String(s?.endTime ?? s?.horaFin ?? s?.fin ?? '').trim();
  }

  private getSessionClassName(sesion: SesionDetallada): string {
    const s = sesion as any;
    return String(
      s?.className ??
      s?.class?.name ??
      s?.clase?.name ??
      s?.schedule?.class?.name ??
      s?.schedule?.clase?.name ??
      '',
    );
  }

  private getSessionClassLevel(sesion: SesionDetallada): string {
    const s = sesion as any;
    return String(s?.classLevel ?? s?.class?.level ?? s?.clase?.level ?? '');
  }

  private getSessionInstructor(sesion: SesionDetallada): string {
    const s = sesion as any;
    return String(s?.instructor ?? '').trim();
  }

  private timeToMinutes(value: string): number {
    const [hours, minutes] = String(value ?? '').split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(date);
    start.setDate(date.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private formatMonthYear(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
  }

  private formatWeekRange(start: Date, end: Date): string {
    const sameMonth = start.getMonth() === end.getMonth();
    const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long' });
    const startMonth = monthFormatter.format(start);
    const endMonth = monthFormatter.format(end);
    const year = start.getFullYear();

    if (sameMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth} ${year}`;
    }

    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
  }
}
