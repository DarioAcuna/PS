import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, of, switchMap, take } from 'rxjs';

import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { RoleFooterComponent } from '../../shared/role-footer/role-footer';

import { AuthService } from '../../services/auth/auth.service';

import { ClasesService } from '../../services/clases/clases.service';
import { Clase, CreateClaseDto, UpdateClaseDto } from '../../services/clases/clases.models';

import { HorariosService } from '../../services/horarios/horarios.service';
import {
  CreateHorarioDto,
  Horario,
  UpdateHorarioDto,
} from '../../services/horarios/horarios.models';

import { SesionesService } from '../../services/sesiones/sesiones.service';
import {
  CreateSesionDto,
  SesionDetallada,
  UpdateSesionDto,
} from '../../services/sesiones/sesiones.models';
import { UsuariosService } from '../../services/usuarios/usuarios.service';
import { Usuario } from '../../services/usuarios/usuarios.models';

type DashboardTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface NavItem {
  id: DashboardTab;
  label: string;
}


interface ClassForm {
  name: string;
  level: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  maxCapacity: number;
  instructor: string;
}

interface ClassView {
  id: number;
  name: string;
  discipline: string;
  level: string;
  instructor: string;
  primarySchedule: string;
  scheduleCount: number;
  upcomingSessionCount: number;
  maxCapacity: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  horarios: Horario[];
  upcomingSessions: SesionDetallada[];
  raw: Clase;
}

interface WeekDaySchedule {
  dayValue: number;
  label: string;
  date: Date;
  dateLabel: string;
}

interface ScheduleSlot {
  startTime: string;
  endTime: string;
}

interface ScheduleItem {
  dayValue: number;
  startTime: string;
  endTime: string;
  className: string;
  level: string;
  instructor: string;
  maxCapacity: number;
}

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleFooterComponent, AdminHeaderComponent],
  templateUrl: './admin-class.html',
  styleUrl: './admin-class.css',
})
export class AdminClasesComponent implements OnInit {
  private readonly clasesService = inject(ClasesService);
  private readonly horariosService = inject(HorariosService);
  private readonly sesionesService = inject(SesionesService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedTab: DashboardTab = 'clases';

  navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  readonly weekDays = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
  ];

  loading = false;
  errorMessage = '';
  deletingClassId: number | null = null;

  clases: Clase[] = [];
  horarios: Horario[] = [];
  sesiones: SesionDetallada[] = [];
  profesores: Usuario[] = [];

  classViews: ClassView[] = [];
  filteredClasses: ClassView[] = [];
  selectedClass: ClassView | null = null;

  weekScheduleDays: WeekDaySchedule[] = [];
  weekScheduleSlots: ScheduleSlot[] = [];
  weekScheduleMonthLabel = '';
  weekScheduleRangeLabel = '';
  private scheduleItemsByKey = new Map<string, ScheduleItem[]>();
  private scheduleWeekOffset = 0;

  classModalOpen = false;
  classModalMode: 'create' | 'edit' = 'create';
  savingClass = false;
  classModalError = '';

  classForm: ClassForm = this.getEmptyClassForm();

  get totalUpcomingSessions(): number {
    return this.classViews.reduce((total, gymClass) => total + gymClass.upcomingSessionCount, 0);
  }

  ngOnInit(): void {
    this.loadPageData();
    this.loadProfesores();
  }

  loadPageData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.clasesService
      .findAll()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (clases: Clase[]) => {
          this.clases = Array.isArray(clases) ? clases : [];

          this.horarios = [];
          this.sesiones = [];

          this.rebuildView();
          this.cdr.detectChanges();

          this.loadExtraClassData();
        },
        error: (error) => {
          console.error('Error al cargar clases:', error);

          this.errorMessage = 'No se pudieron cargar las clases.';
          this.clases = [];
          this.horarios = [];
          this.sesiones = [];
          this.classViews = [];
          this.filteredClasses = [];
          this.selectedClass = null;

          this.cdr.detectChanges();
        },
      });
  }

  private loadExtraClassData(): void {
    forkJoin({
      horarios: this.horariosService.findAll().pipe(
        catchError((error) => {
          console.error('Error al cargar horarios:', error);
          return of([] as Horario[]);
        }),
      ),
      sesiones: this.sesionesService.findAll().pipe(
        catchError((error) => {
          console.error('Error al cargar sesiones:', error);
          return of([] as SesionDetallada[]);
        }),
      ),
    }).subscribe({
      next: ({ horarios, sesiones }) => {
        this.horarios = Array.isArray(horarios) ? horarios : [];
        this.sesiones = Array.isArray(sesiones) ? sesiones : [];

        this.rebuildView();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar datos extra:', error);
        this.cdr.detectChanges();
      },
    });
  }

  private loadProfesores(): void {
    this.usuariosService
      .findAll()
      .pipe(
        catchError((error) => {
          console.error('Error al cargar profesores:', error);
          return of([] as Usuario[]);
        }),
      )
      .subscribe((usuarios) => {
        const profesores = Array.isArray(usuarios) ? usuarios : [];
        this.profesores = profesores.filter(
          (usuario) => usuario.role === 'PROFESOR' && usuario.status === 'ACTIVO',
        );
        this.cdr.detectChanges();
      });
  }

  private rebuildView(): void {
    this.classViews = this.buildClassViews();
    this.filteredClasses = [...this.classViews];
    this.buildWeekSchedule();

    if (this.selectedClass) {
      const selectedId = this.selectedClass.id;
      this.selectedClass = this.classViews.find((gymClass) => gymClass.id === selectedId) || null;
    }
  }

  createClass(): void {
    this.classModalMode = 'create';
    this.classModalOpen = true;
    this.classModalError = '';
    this.selectedClass = null;
    this.classForm = this.getEmptyClassForm();
    this.cdr.detectChanges();
  }

  manageClass(gymClass: ClassView): void {
    this.classModalMode = 'edit';
    this.classModalOpen = true;
    this.classModalError = '';
    this.selectedClass = gymClass;

    const horarios = Array.isArray(gymClass.horarios) ? gymClass.horarios : [];
    const dayValues = horarios
      .map((horario) => this.getHorarioDayValue(horario))
      .filter((day): day is number => day !== null && !Number.isNaN(day));
    const uniqueDays = Array.from(new Set(dayValues));
    const instructor = gymClass.instructor || '';

    this.classForm = {
      name: gymClass.name || '',
      level: gymClass.level || '',
      daysOfWeek: uniqueDays.length > 0 ? this.sortDays(uniqueDays) : [1],
      startTime: horarios[0]?.startTime ?? '18:00',
      endTime: horarios[0]?.endTime ?? '19:00',
      maxCapacity: Number(horarios[0]?.maxCapacity ?? 20),
      instructor,
    };

    this.cdr.detectChanges();
  }

  closeClassDetail(): void {
    this.closeClassModal();
  }

  closeClassModal(): void {
    if (this.savingClass) {
      return;
    }

    this.classModalOpen = false;
    this.classModalError = '';
    this.selectedClass = null;
    this.classForm = this.getEmptyClassForm();
    this.cdr.detectChanges();
  }

  saveClass(): void {
    this.classModalError = '';

    const name = this.classForm.name.trim();
    const level = this.classForm.level.trim();
    const startTime = this.classForm.startTime.trim();
    const endTime = this.classForm.endTime.trim();
    const instructor = this.classForm.instructor.trim();

    if (!name) {
      this.classModalError = 'El nombre de la clase es obligatorio.';
      this.cdr.detectChanges();
      return;
    }

    if (!level) {
      this.classModalError = 'El nivel de la clase es obligatorio.';
      this.cdr.detectChanges();
      return;
    }

    if (!instructor) {
      this.classModalError = 'El instructor es obligatorio.';
      this.cdr.detectChanges();
      return;
    }

    if (!Array.isArray(this.classForm.daysOfWeek) || this.classForm.daysOfWeek.length === 0) {
      this.classModalError = 'Selecciona al menos un día de la semana.';
      this.cdr.detectChanges();
      return;
    }

    if (!startTime || !endTime) {
      this.classModalError = 'La hora de inicio y fin son obligatorias.';
      this.cdr.detectChanges();
      return;
    }

    if (startTime >= endTime) {
      this.classModalError = 'La hora de inicio debe ser menor que la de fin.';
      this.cdr.detectChanges();
      return;
    }

    if (Number(this.classForm.maxCapacity) < 1) {
      this.classModalError = 'La capacidad debe ser mayor que 0.';
      this.cdr.detectChanges();
      return;
    }

    if (this.classModalMode === 'edit' && !this.selectedClass) {
      this.classModalError = 'No se ha seleccionado ninguna clase para editar.';
      this.cdr.detectChanges();
      return;
    }

    this.savingClass = true;
    this.cdr.detectChanges();

    const request: Observable<unknown> =
      this.classModalMode === 'create'
        ? this.createFullClassFlow()
        : this.updateFullClassFlow();

    request
      .pipe(
        finalize(() => {
          this.savingClass = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.classModalOpen = false;
          this.selectedClass = null;
          this.classForm = this.getEmptyClassForm();
          this.loadPageData();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al guardar clase/horario/sesión:', error);
          console.error('Respuesta backend:', error?.error);

          const backendMessage = Array.isArray(error?.error?.message)
            ? error.error.message.join(', ')
            : error?.error?.message;

          this.classModalError =
            backendMessage ||
            (this.classModalMode === 'create'
              ? 'No se pudo crear la clase completa.'
              : 'No se pudo actualizar la clase completa.');

          this.cdr.detectChanges();
        },
      });
  }

  private createFullClassFlow(): Observable<unknown> {
    const selectedDays = this.sortDays(this.classForm.daysOfWeek);

    return this.clasesService.create(this.buildClassPayload() as CreateClaseDto).pipe(
      switchMap((createdClass) =>
        forkJoin(
          selectedDays.map((dayOfWeek) =>
            this.horariosService
              .create(this.buildCreateHorarioPayload(createdClass.id, dayOfWeek))
              .pipe(
                switchMap((createdHorario) =>
                  this.createRecurringSessions(createdHorario.id, dayOfWeek),
                ),
              ),
          ),
        ),
      ),
    );
  }

  private updateFullClassFlow(): Observable<unknown> {
    const selectedClass = this.selectedClass!;

    return this.clasesService
      .update(selectedClass.id, this.buildClassPayload() as UpdateClaseDto)
      .pipe(switchMap(() => this.syncSchedulesAfterUpdate(selectedClass)));
  }

  private syncSchedulesAfterUpdate(selectedClass: ClassView): Observable<unknown> {
    const selectedDays = this.sortDays(this.classForm.daysOfWeek);
    const existingSchedules = Array.isArray(selectedClass.horarios) ? selectedClass.horarios : [];
    const scheduleByDay = new Map<number, Horario>();

    for (const horario of existingSchedules) {
      const dayValue = this.getHorarioDayValue(horario);
      if (dayValue !== null && !Number.isNaN(dayValue)) {
        scheduleByDay.set(dayValue, horario);
      }
    }

    const ops: Observable<unknown>[] = [];

    for (const horario of existingSchedules) {
      const dayValue = this.getHorarioDayValue(horario);
      if (dayValue === null || Number.isNaN(dayValue)) {
        continue;
      }

      if (!selectedDays.includes(dayValue)) {
        ops.push(this.removeScheduleAndSessions(horario));
      }
    }

    for (const dayOfWeek of selectedDays) {
      const existing = scheduleByDay.get(dayOfWeek);

      if (existing) {
        ops.push(this.updateScheduleAndSessions(existing, dayOfWeek));
      } else {
        ops.push(this.createScheduleAndSessions(selectedClass.id, dayOfWeek));
      }
    }

    if (ops.length === 0) {
      return of(null);
    }

    return forkJoin(ops);
  }

  private createScheduleAndSessions(classId: number, dayOfWeek: number): Observable<unknown> {
    return this.horariosService
      .create(this.buildCreateHorarioPayload(classId, dayOfWeek))
      .pipe(switchMap((createdHorario) => this.createRecurringSessions(createdHorario.id, dayOfWeek)));
  }

  private updateScheduleAndSessions(horario: Horario, dayOfWeek: number): Observable<unknown> {
    return this.horariosService
      .update(this.getHorarioId(horario), this.buildUpdateHorarioPayload(dayOfWeek))
      .pipe(
        switchMap(() => {
          const upcomingSessions = this.getUpcomingSessionsForSchedule(this.getHorarioId(horario));
          if (upcomingSessions.length === 0) {
            return this.createRecurringSessions(this.getHorarioId(horario), dayOfWeek);
          }
          return this.updateUpcomingSessions(upcomingSessions);
        }),
      );
  }

  private removeScheduleAndSessions(horario: Horario): Observable<unknown> {
    const scheduleId = this.getHorarioId(horario);
    const sessions = this.getSessionsForSchedule(scheduleId);

    const deletes = sessions.map((sesion) =>
      this.sesionesService.remove(sesion.id).pipe(
        catchError((error) => {
          console.error('Error al eliminar sesión:', error);
          return of(null);
        }),
      ),
    );

    return forkJoin(deletes).pipe(
      switchMap(() =>
        this.horariosService.remove(scheduleId).pipe(
          catchError((error) => {
            console.error('Error al eliminar horario:', error);
            return of(null);
          }),
        ),
      ),
    );
  }

  private createRecurringSessions(scheduleId: number, dayOfWeek: number): Observable<unknown> {
    const dates = this.getNextDatesForDay(dayOfWeek, 8);
    const payloads = dates.map((date) => this.buildCreateSesionPayload(scheduleId, date));

    return forkJoin(
      payloads.map((payload) =>
        this.sesionesService.create(payload).pipe(
          catchError((error) => {
            console.error('Error al crear sesión automática:', error);
            return of(null);
          }),
        ),
      ),
    );
  }

  deleteClassFromModal(): void {
    if (!this.selectedClass) {
      return;
    }

    this.deleteClass(this.selectedClass);
  }

  deleteClass(gymClass: ClassView): void {
    const confirmed = confirm(`¿Seguro que quieres eliminar la clase "${gymClass.name}"?`);

    if (!confirmed) {
      return;
    }

    this.deletingClassId = gymClass.id;
    this.errorMessage = '';
    this.classModalError = '';
    this.cdr.detectChanges();

    this.clasesService
      .remove(gymClass.id)
      .pipe(
        finalize(() => {
          this.deletingClassId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.classModalOpen = false;
          this.selectedClass = null;
          this.classForm = this.getEmptyClassForm();
          this.loadPageData();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error al eliminar clase:', error);

          const backendMessage = Array.isArray(error?.error?.message)
            ? error.error.message.join(', ')
            : error?.error?.message;
          const message = backendMessage || 'No se pudo eliminar la clase.';

          this.errorMessage = message;
          this.classModalError = message;

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
          void this.router.navigate(['/login']);
        },
      });
  }

  trackByClassId(_: number, gymClass: ClassView): number {
    return gymClass.id;
  }

  private buildClassViews(): ClassView[] {
    return (this.clases || []).map((gymClass) => {
      const classHorarios = this.horarios.filter(
        (horario) => this.getHorarioClassId(horario) === gymClass.id,
      );
      const primaryHorario = classHorarios[0];
      const dayLabels = Array.from(
        new Set(
          classHorarios
            .map((horario) => this.getHorarioDay(horario))
            .filter((label) => Boolean(label)),
        ),
      );
      const upcomingSessions = classHorarios.flatMap((horario) =>
        this.getUpcomingSessionsForSchedule(this.getHorarioId(horario)),
      );

      return {
        id: gymClass.id,
        name: gymClass.name,
        discipline: '',
        level: gymClass.level ?? '',
        instructor: primaryHorario ? this.getInstructorFromHorario(primaryHorario) : '',
        primarySchedule: primaryHorario ? this.getHorarioText(primaryHorario) : '',
        scheduleCount: classHorarios.length,
        upcomingSessionCount: upcomingSessions.length,
        maxCapacity: Number(primaryHorario?.maxCapacity ?? 0),
        dayLabel: dayLabels.join(', '),
        startTime: primaryHorario?.startTime ?? '',
        endTime: primaryHorario?.endTime ?? '',
        horarios: classHorarios,
        upcomingSessions,
        raw: gymClass,
      };
    });
  }

  private buildClassPayload(): CreateClaseDto | UpdateClaseDto {
    return {
      name: this.classForm.name.trim(),
      level: this.classForm.level.trim(),
    };
  }

  private buildCreateHorarioPayload(classId: number, dayOfWeek: number): CreateHorarioDto {
    return {
      classId,
      dayOfWeek,
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      maxCapacity: Number(this.classForm.maxCapacity),
    };
  }

  private buildUpdateHorarioPayload(dayOfWeek: number): UpdateHorarioDto {
    return {
      dayOfWeek,
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      maxCapacity: Number(this.classForm.maxCapacity),
    };
  }

  private buildCreateSesionPayload(scheduleId: number, date: string): CreateSesionDto {
    return {
      scheduleId,
      date,
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      instructor: this.classForm.instructor.trim(),
    };
  }

  private getHorarioId(horario: Horario): number {
    const h = horario as any;
    return Number(h?.id ?? h?.scheduleId ?? 0);
  }

  private getSessionScheduleId(sesion: SesionDetallada): number {
    const s = sesion as any;
    return Number(s?.scheduleId ?? s?.horarioId ?? s?.schedule?.id ?? s?.horario?.id ?? 0);
  }

  private getSessionInstructor(sesion: SesionDetallada): string {
    const s = sesion as any;
    return String(s?.instructor ?? '').trim();
  }

  private getInstructorFromHorario(horario: Horario): string {
    const scheduleId = this.getHorarioId(horario);
    const upcoming = this.getUpcomingSessionsForSchedule(scheduleId);
    const withInstructor = upcoming.find((sesion) => this.getSessionInstructor(sesion));
    return withInstructor ? this.getSessionInstructor(withInstructor) : '';
  }

  getScheduleItems(dayValue: number, slot: ScheduleSlot): ScheduleItem[] {
    const key = this.getScheduleKey(dayValue, slot.startTime, slot.endTime);
    return this.scheduleItemsByKey.get(key) ?? [];
  }

  private buildWeekSchedule(): void {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + this.scheduleWeekOffset * 7);
    const weekStart = this.getStartOfWeek(baseDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

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

    const slotMap = new Map<string, ScheduleSlot>();
    this.scheduleItemsByKey = new Map<string, ScheduleItem[]>();

    for (const horario of this.horarios) {
      const dayValue = this.getHorarioDayValue(horario);
      const startTime = this.getHorarioStartTime(horario);
      const endTime = this.getHorarioEndTime(horario);

      if (dayValue === null || !startTime || !endTime) {
        continue;
      }

      const slotKey = `${startTime}-${endTime}`;
      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, { startTime, endTime });
      }

      const item: ScheduleItem = {
        dayValue,
        startTime,
        endTime,
        className: this.getHorarioClassName(horario) || 'Clase',
        level: this.getHorarioClassLevel(horario),
        instructor: this.getInstructorFromHorario(horario),
        maxCapacity: Number((horario as any)?.maxCapacity ?? 0),
      };

      const cellKey = this.getScheduleKey(dayValue, startTime, endTime);
      const items = this.scheduleItemsByKey.get(cellKey) ?? [];
      items.push(item);
      this.scheduleItemsByKey.set(cellKey, items);
    }

    this.weekScheduleSlots = Array.from(slotMap.values()).sort(
      (a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
    );
  }

  private getScheduleKey(dayValue: number, startTime: string, endTime: string): string {
    return `${dayValue}|${startTime}|${endTime}`;
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

  private timeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private getHorarioStartTime(horario: Horario): string {
    const h = horario as any;
    return String(h?.startTime ?? h?.horaInicio ?? h?.inicio ?? '').trim();
  }

  private getHorarioEndTime(horario: Horario): string {
    const h = horario as any;
    return String(h?.endTime ?? h?.horaFin ?? h?.fin ?? '').trim();
  }

  private getHorarioClassLevel(horario: Horario): string {
    const h = horario as any;
    return String(
      h?.class?.level ?? h?.class?.nivel ?? h?.clase?.level ?? h?.clase?.nivel ?? '',
    );
  }

  private getEmptyClassForm(): ClassForm {
    return {
      name: '',
      level: '',
      daysOfWeek: [1],
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 20,
      instructor: '',
    };
  }

  private getNextDatesForDay(dayOfWeek: number, occurrences: number): string[] {
    const dates: string[] = [];
    const date = new Date();
    const currentDay = date.getDay();
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;

    date.setDate(date.getDate() + daysToAdd);

    for (let index = 0; index < occurrences; index += 1) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      date.setDate(date.getDate() + 7);
    }

    return dates;
  }

  private getUpcomingSessionsForSchedule(scheduleId: number): SesionDetallada[] {
    const sessions = this.getSessionsForSchedule(scheduleId);

    return sessions
      .filter((sesion) => this.isUpcomingSession(sesion))
      .sort((a, b) => this.getSessionDateTime(a).getTime() - this.getSessionDateTime(b).getTime());
  }

  private getSessionsForSchedule(scheduleId: number): SesionDetallada[] {
    return this.sesiones.filter((sesion) => this.getSessionScheduleId(sesion) === scheduleId);
  }

  private updateUpcomingSessions(upcomingSessions: SesionDetallada[]): Observable<unknown> {
    const payload: UpdateSesionDto = {
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      instructor: this.classForm.instructor.trim(),
      status: 'MODIFIED',
    };

    return forkJoin(
      upcomingSessions.map((sesion) =>
        this.sesionesService.update(sesion.id, payload).pipe(
          catchError((error) => {
            console.error('Error al actualizar sesión:', error);
            return of(null);
          }),
        ),
      ),
    );
  }

  private getSessionClassId(sesion: SesionDetallada): number {
    const s = sesion as any;

    return Number(
      s?.classId ??
      s?.claseId ??
      s?.gymClassId ??
      s?.class?.id ??
      s?.clase?.id ??
      s?.schedule?.classId ??
      s?.schedule?.class?.id ??
      s?.schedule?.clase?.id ??
      s?.horario?.classId ??
      s?.horario?.class?.id ??
      s?.horario?.clase?.id ??
      0,
    );
  }

  private getSessionClassName(sesion: SesionDetallada): string {
    const s = sesion as any;

    return String(
      s?.class?.name ??
      s?.class?.nombre ??
      s?.clase?.name ??
      s?.clase?.nombre ??
      s?.schedule?.class?.name ??
      s?.schedule?.class?.nombre ??
      s?.schedule?.clase?.name ??
      s?.schedule?.clase?.nombre ??
      s?.horario?.class?.name ??
      s?.horario?.class?.nombre ??
      s?.horario?.clase?.name ??
      s?.horario?.clase?.nombre ??
      '',
    );
  }

  private isUpcomingSession(sesion: SesionDetallada): boolean {
    return this.getSessionDateTime(sesion).getTime() >= new Date().getTime();
  }

  private getSessionDateTime(sesion: SesionDetallada): Date {
    const s = sesion as any;

    const rawDate = s?.date ?? s?.fecha;
    const rawStartTime = s?.startTime ?? s?.horaInicio ?? s?.inicio;

    if (!rawDate) {
      return new Date(0);
    }

    if (!rawStartTime) {
      const parsedOnlyDate = new Date(rawDate);
      return isNaN(parsedOnlyDate.getTime()) ? new Date(0) : parsedOnlyDate;
    }

    const datePart = String(rawDate).split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = String(rawStartTime).split(':').map(Number);

    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  }

  private getHorarioClassId(horario: Horario): number {
    const h = horario as any;

    return Number(
      h?.classId ??
      h?.claseId ??
      h?.gymClassId ??
      h?.class?.id ??
      h?.clase?.id ??
      h?.gymClass?.id ??
      0,
    );
  }

  private getHorarioClassName(horario: Horario): string {
    const h = horario as any;

    return String(
      h?.class?.name ??
      h?.class?.nombre ??
      h?.clase?.name ??
      h?.clase?.nombre ??
      h?.gymClass?.name ??
      h?.gymClass?.nombre ??
      '',
    );
  }

  getHorarioText(horario: Horario): string {
    const h = horario as any;

    const day = this.getHorarioDay(horario);
    const startTime = h?.startTime ?? h?.horaInicio ?? h?.inicio ?? '';
    const endTime = h?.endTime ?? h?.horaFin ?? h?.fin ?? '';

    if (day && startTime && endTime) {
      return `${day}, ${startTime} - ${endTime}`;
    }

    if (day && startTime) {
      return `${day}, ${startTime}`;
    }

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    return day || 'Horario no disponible';
  }

  private getHorarioDay(horario: Horario): string {
    const h = horario as any;

    const rawDay =
      h?.dayOfWeek ??
      h?.day ??
      h?.dia ??
      h?.weekday ??
      h?.weekDay ??
      '';

    return this.formatDay(rawDay);
  }

  private getHorarioDayValue(horario: Horario): number | null {
    const h = horario as any;
    const rawDay = h?.dayOfWeek ?? h?.day ?? h?.dia ?? h?.weekday ?? h?.weekDay ?? null;

    if (rawDay === null || rawDay === undefined || rawDay === '') {
      return null;
    }

    const parsed = Number(rawDay);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private formatDay(value: unknown): string {
    const dayMap: Record<string, string> = {
      '0': 'Domingo',
      '1': 'Lunes',
      '2': 'Martes',
      '3': 'Miércoles',
      '4': 'Jueves',
      '5': 'Viernes',
      '6': 'Sábado',
      monday: 'Lunes',
      lunes: 'Lunes',
      tuesday: 'Martes',
      martes: 'Martes',
      wednesday: 'Miércoles',
      miercoles: 'Miércoles',
      miércoles: 'Miércoles',
      thursday: 'Jueves',
      jueves: 'Jueves',
      friday: 'Viernes',
      viernes: 'Viernes',
      saturday: 'Sábado',
      sabado: 'Sábado',
      sábado: 'Sábado',
      sunday: 'Domingo',
      domingo: 'Domingo',
    };

    const key = this.normalize(String(value ?? ''));

    return dayMap[key] || String(value ?? '');
  }

  toggleDaySelection(dayValue: number, checked: boolean): void {
    const current = new Set(this.classForm.daysOfWeek);
    if (checked) {
      current.add(dayValue);
    } else {
      current.delete(dayValue);
    }
    this.classForm.daysOfWeek = this.sortDays(Array.from(current));
  }

  getUsuarioDisplayName(usuario: Usuario): string {
    const fullName = [usuario.firstName, usuario.lastName].filter(Boolean).join(' ').trim();
    return fullName || usuario.name || usuario.email;
  }

  private sortDays(days: number[]): number[] {
    const order = new Map(this.weekDays.map((day, index) => [day.value, index]));
    return [...days].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  }

  private normalize(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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
}
