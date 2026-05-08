import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, forkJoin, of, switchMap } from 'rxjs';

import { FooterComponent } from '../../shared/admin-footer/admin-footer';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';

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

type DashboardTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface NavItem {
  id: DashboardTab;
  label: string;
}

interface ClassFilters {
  search: string;
  discipline: string;
  level: string;
  instructor: string;
  day: string;
}

interface ClassForm {
  name: string;
  level: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  instructor: string;
  sessionDate: string;
  createSession: boolean;
  updateUpcomingSessions: boolean;
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
  horarios: Horario[];
  upcomingSessions: SesionDetallada[];
  raw: Clase;
}

@Component({
  selector: 'app-clases',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent, AdminHeaderComponent],
  templateUrl: './admin-class.html',
  styleUrl: './admin-class.css',
})
export class AdminClasesComponent implements OnInit {
  private readonly clasesService = inject(ClasesService);
  private readonly horariosService = inject(HorariosService);
  private readonly sesionesService = inject(SesionesService);
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

  classViews: ClassView[] = [];
  filteredClasses: ClassView[] = [];
  selectedClass: ClassView | null = null;

  disciplineOptions: string[] = [];
  levelOptions: string[] = [];
  instructorOptions: string[] = [];
  dayOptions: string[] = [];

  filters: ClassFilters = {
    search: '',
    discipline: '',
    level: '',
    instructor: '',
    day: '',
  };

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

  private rebuildView(): void {
    this.classViews = this.buildClassViews();
    this.buildFilterOptions();
    this.applyFilters();

    if (this.selectedClass) {
      const selectedId = this.selectedClass.id;
      this.selectedClass = this.classViews.find((gymClass) => gymClass.id === selectedId) || null;
    }
  }

  searchClasses(): void {
    this.applyFilters();
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      discipline: '',
      level: '',
      instructor: '',
      day: '',
    };

    this.applyFilters();
    this.cdr.detectChanges();
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

    const horario = gymClass.horarios[0] as any;
    const firstSession = gymClass.upcomingSessions[0] as any;

    this.classForm = {
      name: gymClass.name || '',
      level: gymClass.level || '',
      dayOfWeek: Number(horario?.dayOfWeek ?? 1),
      startTime: horario?.startTime ?? firstSession?.startTime ?? '18:00',
      endTime: horario?.endTime ?? firstSession?.endTime ?? '19:00',
      maxCapacity: Number(horario?.maxCapacity ?? 20),
      instructor: firstSession?.instructor ?? '',
      sessionDate: firstSession?.date
        ? String(firstSession.date).split('T')[0]
        : this.getTodayInputDate(),
      createSession: false,
      updateUpcomingSessions: false,
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
    const sessionDate = this.classForm.sessionDate.trim();

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

    if (this.classForm.createSession && !sessionDate) {
      this.classModalError = 'La fecha de la sesión es obligatoria.';
      this.cdr.detectChanges();
      return;
    }

    if (
      this.classForm.createSession &&
      sessionDate &&
      !this.dateMatchesDayOfWeek(sessionDate, Number(this.classForm.dayOfWeek))
    ) {
      this.classModalError = 'La fecha de la sesión debe coincidir con el día del horario.';
      this.cdr.detectChanges();
      return;
    }

    if (Number(this.classForm.maxCapacity) < 1) {
      this.classModalError = 'El aforo máximo debe ser mayor que 0.';
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
    return this.clasesService.create(this.buildClassPayload() as CreateClaseDto).pipe(
      switchMap((createdClass) =>
        this.horariosService.create(this.buildCreateHorarioPayload(createdClass.id)).pipe(
          switchMap((createdHorario) => this.createSessionIfNeeded(createdHorario.id)),
        ),
      ),
    );
  }

  private updateFullClassFlow(): Observable<unknown> {
    const selectedClass = this.selectedClass!;

    return this.clasesService
      .update(selectedClass.id, this.buildClassPayload() as UpdateClaseDto)
      .pipe(
        switchMap(() => {
          const firstHorario = selectedClass.horarios[0];

          if (firstHorario) {
            return this.horariosService.update(
              firstHorario.id,
              this.buildUpdateHorarioPayload(selectedClass.id),
            );
          }

          return this.horariosService.create(
            this.buildCreateHorarioPayload(selectedClass.id),
          );
        }),
        switchMap((horario) => this.createSessionIfNeeded(horario.id)),
        switchMap(() => this.updateUpcomingSessionsIfNeeded()),
      );
  }

  private buildClassPayload(): Partial<CreateClaseDto & UpdateClaseDto> {
    return {
      name: this.classForm.name.trim(),
      level: this.classForm.level.trim(),
    };
  }

  private buildCreateHorarioPayload(classId: number): CreateHorarioDto {
    return {
      classId,
      dayOfWeek: Number(this.classForm.dayOfWeek),
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      maxCapacity: Number(this.classForm.maxCapacity) || 20,
    };
  }

  private buildUpdateHorarioPayload(classId: number): UpdateHorarioDto {
    return {
      classId,
      dayOfWeek: Number(this.classForm.dayOfWeek),
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      maxCapacity: Number(this.classForm.maxCapacity) || 20,
    };
  }

  private createSessionIfNeeded(scheduleId: number): Observable<unknown> {
    if (!this.classForm.createSession) {
      return of(null);
    }

    const payload: CreateSesionDto = {
      scheduleId,
      date: this.classForm.sessionDate.trim(),
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
    };

    const instructor = this.classForm.instructor.trim();

    if (instructor) {
      payload.instructor = instructor;
    }

    return this.sesionesService.create(payload);
  }

  private updateUpcomingSessionsIfNeeded(): Observable<unknown> {
    if (!this.classForm.updateUpcomingSessions || !this.selectedClass) {
      return of(null);
    }

    const upcomingSessions = this.selectedClass.upcomingSessions;

    if (upcomingSessions.length === 0) {
      return of(null);
    }

    const payload: UpdateSesionDto = {
      startTime: this.classForm.startTime.trim(),
      endTime: this.classForm.endTime.trim(),
      status: 'MODIFIED',
    };

    const instructor = this.classForm.instructor.trim();

    if (instructor) {
      payload.instructor = instructor;
    }

    return forkJoin(
      upcomingSessions.map((sesion) =>
        this.sesionesService.update(sesion.id, payload),
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
        void this.router.navigate(['/panel-admin']);
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
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  onClassDayChange(dayOfWeek: number | string): void {
    const selectedDay = Number(dayOfWeek);

    if (!Number.isNaN(selectedDay)) {
      this.classForm.dayOfWeek = selectedDay;
      this.classForm.sessionDate = this.getNextInputDateForDay(selectedDay);
    }
  }

  trackByClassId(_: number, gymClass: ClassView): number {
    return gymClass.id;
  }

  private getEmptyClassForm(): ClassForm {
    const defaultDayOfWeek = 1;

    return {
      name: '',
      level: '',
      dayOfWeek: defaultDayOfWeek,
      startTime: '18:00',
      endTime: '19:00',
      maxCapacity: 20,
      instructor: '',
      sessionDate: this.getNextInputDateForDay(defaultDayOfWeek),
      createSession: true,
      updateUpcomingSessions: false,
    };
  }

  private getTodayInputDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getNextInputDateForDay(dayOfWeek: number): string {
    const date = new Date();
    const currentDay = date.getDay();
    const daysToAdd = (dayOfWeek - currentDay + 7) % 7;

    date.setDate(date.getDate() + daysToAdd);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private dateMatchesDayOfWeek(dateValue: string, dayOfWeek: number): boolean {
    const [year, month, day] = dateValue.split('-').map(Number);

    if (!year || !month || !day) {
      return false;
    }

    return new Date(year, month - 1, day).getDay() === dayOfWeek;
  }

  private buildClassViews(): ClassView[] {
    return this.clases
      .map((clase) => {
        const classId = this.getClassId(clase);
        const className = this.getClassName(clase);

        const classHorarios = this.horarios.filter((horario) => {
          const horarioClassId = this.getHorarioClassId(horario);
          const horarioClassName = this.getHorarioClassName(horario);

          return (
            horarioClassId === classId ||
            this.normalize(horarioClassName) === this.normalize(className)
          );
        });

        const classSessions = this.sesiones.filter((sesion) => {
          const sessionClassId = this.getSessionClassId(sesion);
          const sessionClassName = this.getSessionClassName(sesion);

          return (
            sessionClassId === classId ||
            this.normalize(sessionClassName) === this.normalize(className)
          );
        });

        const upcomingSessions = classSessions
          .filter((sesion) => this.isUpcomingSession(sesion))
          .sort(
            (a, b) => this.getSessionDateTime(a).getTime() - this.getSessionDateTime(b).getTime(),
          );

        const instructor =
          classHorarios.map((horario) => this.getInstructorFromHorario(horario)).find(Boolean) ||
          upcomingSessions.map((sesion) => this.getSessionInstructor(sesion)).find(Boolean) ||
          '';

        const primarySchedule =
          classHorarios.length > 0 ? this.getHorarioText(classHorarios[0]) : '';

        return {
          id: classId,
          name: className,
          discipline: this.getClassDiscipline(clase),
          level: this.getClassLevel(clase),
          instructor,
          primarySchedule,
          scheduleCount: classHorarios.length,
          upcomingSessionCount: upcomingSessions.length,
          horarios: classHorarios,
          upcomingSessions,
          raw: clase,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private buildFilterOptions(): void {
    this.disciplineOptions = this.uniqueSorted(
      this.classViews.map((gymClass) => gymClass.discipline),
    );

    this.levelOptions = this.uniqueSorted(this.classViews.map((gymClass) => gymClass.level));

    this.instructorOptions = this.uniqueSorted(
      this.classViews.map((gymClass) => gymClass.instructor),
    );

    this.dayOptions = this.uniqueSorted(
      this.horarios.map((horario) => this.getHorarioDay(horario)),
    );
  }

  private applyFilters(): void {
    const search = this.normalize(this.filters.search);
    const discipline = this.normalize(this.filters.discipline);
    const level = this.normalize(this.filters.level);
    const instructor = this.normalize(this.filters.instructor);
    const day = this.normalize(this.filters.day);

    this.filteredClasses = this.classViews.filter((gymClass) => {
      const classDays = gymClass.horarios.map((horario) =>
        this.normalize(this.getHorarioDay(horario)),
      );

      const matchesSearch =
        !search ||
        this.normalize(gymClass.name).includes(search) ||
        this.normalize(gymClass.discipline).includes(search) ||
        this.normalize(gymClass.level).includes(search) ||
        this.normalize(gymClass.instructor).includes(search);

      const matchesDiscipline = !discipline || this.normalize(gymClass.discipline) === discipline;

      const matchesLevel = !level || this.normalize(gymClass.level) === level;

      const matchesInstructor = !instructor || this.normalize(gymClass.instructor) === instructor;

      const matchesDay = !day || classDays.includes(day);

      return matchesSearch && matchesDiscipline && matchesLevel && matchesInstructor && matchesDay;
    });
  }

  private getClassId(clase: Clase): number {
    const c = clase as any;
    return Number(c?.id ?? c?.classId ?? c?.claseId ?? 0);
  }

  private getClassName(clase: Clase): string {
    const c = clase as any;
    return String(c?.name ?? c?.nombre ?? c?.title ?? 'Clase');
  }

  private getClassDiscipline(clase: Clase): string {
    const c = clase as any;
    return String(c?.discipline ?? c?.disciplina ?? c?.modality ?? c?.modalidad ?? '');
  }

  private getClassLevel(clase: Clase): string {
    const c = clase as any;
    return String(c?.level ?? c?.nivel ?? '');
  }

  private getClassDescription(clase: Clase): string {
    const c = clase as any;
    return String(c?.description ?? c?.descripcion ?? '');
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

  getInstructorFromHorario(horario: Horario): string {
    const h = horario as any;

    const instructor = h?.instructor ?? h?.coach ?? h?.profesor ?? null;

    const fullName = [
      instructor?.name ?? instructor?.nombre ?? '',
      instructor?.surname ?? instructor?.apellido ?? instructor?.lastName ?? '',
    ]
      .join(' ')
      .trim();

    return String(fullName || h?.instructorName || h?.nombreInstructor || h?.coachName || '');
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

  getSessionInstructor(sesion: SesionDetallada): string {
    const s = sesion as any;

    const instructor =
      s?.instructor ??
      s?.coach ??
      s?.profesor ??
      s?.schedule?.instructor ??
      s?.schedule?.coach ??
      s?.horario?.instructor ??
      null;

    const fullName = [
      instructor?.name ?? instructor?.nombre ?? '',
      instructor?.surname ?? instructor?.apellido ?? instructor?.lastName ?? '',
    ]
      .join(' ')
      .trim();

    return String(fullName || s?.instructorName || s?.nombreInstructor || s?.coachName || '');
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

  buildSesionSubtitle(sesion: SesionDetallada): string {
    const s = sesion as any;

    const rawDate = s?.date ?? s?.fecha ?? '';
    const startTime = s?.startTime ?? s?.horaInicio ?? s?.inicio ?? '';
    const endTime = s?.endTime ?? s?.horaFin ?? s?.fin ?? '';

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

    return formattedDate || 'Sesión sin fecha';
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

  private uniqueSorted(values: string[]): string[] {
    return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }

  private normalize(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
