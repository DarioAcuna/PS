import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, take } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../services/auth/auth.models';
import { Evento } from '../../services/eventos/eventos.models';
import { EventosService } from '../../services/eventos/eventos.service';
import { ReservasService } from '../../services/reservas/reservas.service';
import { ReservaDetallada } from '../../services/reservas/reservas.models';
import { SesionesService } from '../../services/sesiones/sesiones.service';
import { SesionDetallada } from '../../services/sesiones/sesiones.models';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { RoleFooterComponent } from '../../shared/role-footer/role-footer';

type HeaderTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface HeaderNavItem {
  id: HeaderTab;
  label: string;
}

interface ScheduleDisplayItem {
  id: string;
  type: 'class' | 'event';
  startTime: string;
  endTime?: string;
  title: string;
  subtitle: string;
  description: string;
  capacity: number;
  session?: SesionDetallada;
  event?: Evento;
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent, RoleFooterComponent],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class HorariosComponent implements OnInit {
  readonly selectedTab = '';
  readonly navItems: HeaderNavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  readonly sessions = signal<SesionDetallada[]>([]);
  readonly events = signal<Evento[]>([]);
  readonly profile = signal<User | null>(null);
  readonly myReservationSessionIds = signal<Set<number>>(new Set());
  readonly myReservationEventIds = signal<Set<number>>(new Set());
  readonly reservationCounts = signal<Record<number, number>>({});
  readonly eventReservationCounts = signal<Record<number, number>>({});
  readonly participantsBySession = signal<Record<number, ReservaDetallada[]>>({});
  readonly participantsModalSessionId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly loadingParticipants = signal<number | null>(null);
  readonly actionSessionId = signal<number | null>(null);
  readonly actionEventId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly noticeMessage = signal('');
  readonly selectedDate = signal(this.getTodayInputDate());
  readonly selectedClass = signal('');

  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly monthlyClassLimit = computed(
    () => this.profile()?.membership?.monthlyClassLimit ?? 0,
  );
  readonly usedClasses = computed(() => this.profile()?.membership?.usedClasses ?? 0);
  readonly membershipExpiresAt = computed(
    () => this.profile()?.membership?.expiresAt ?? null,
  );
  readonly remainingAttendances = computed(() =>
    Math.max(this.monthlyClassLimit() - this.usedClasses(), 0),
  );
  readonly hasActivePlan = computed(() => this.monthlyClassLimit() > 0);
  readonly hasAvailableAttendance = computed(
    () => this.hasActivePlan() && this.remainingAttendances() > 0,
  );
  readonly classOptions = computed(() => {
    const names = this.sessions()
      .map((session) => this.classNameValue(session))
      .filter(Boolean) as string[];

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  });
  readonly filteredSessions = computed(() => {
    const selectedClass = this.selectedClass();

    return this.sessions().filter((session) => {
      if (!selectedClass) {
        return true;
      }

      return this.classNameValue(session) === selectedClass;
    });
  });
  readonly visibleScheduleItems = computed<ScheduleDisplayItem[]>(() => {
    const sessions = this.filteredSessions();
    const events = this.getEventsForSelectedDate();
    const items: ScheduleDisplayItem[] = [];

    for (const session of sessions) {
      const replacementEvent = events.find((event) =>
        this.timeRangesOverlap(
          session.startTime,
          session.endTime,
          event.startTime,
          event.endTime,
        ),
      );

      if (replacementEvent) {
        continue;
      }

      items.push({
        id: `class-${session.id}`,
        type: 'class',
        startTime: session.startTime,
        endTime: session.endTime,
        title: this.className(session),
        subtitle: this.instructorName(session),
        description: this.classLevel(session),
        capacity: this.capacity(session),
        session,
      });
    }

    for (const event of events) {

      items.push({
        id: `event-${event.id}`,
        type: 'event',
        startTime: event.startTime,
        endTime: event.endTime,
        title: event.name,
        subtitle: 'Evento',
        description: event.description,
        capacity: event.capacity,
        event,
      });
    }

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  constructor(
    private readonly authService: AuthService,
    private readonly sesionesService: SesionesService,
    private readonly reservasService: ReservasService,
    private readonly eventosService: EventosService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadDay();
  }

  loadDay(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.sessions.set([]);
    this.events.set([]);
    this.reservationCounts.set({});
    this.eventReservationCounts.set({});
    this.participantsBySession.set({});
    this.participantsModalSessionId.set(null);

    forkJoin({
      sessions: this.sesionesService.findAll({ date: this.selectedDate() }),
      events: this.eventosService.findAll(),
      profile: this.authService
        .getProfile()
        .pipe(catchError(() => of(this.authService.getCurrentUser()))),
      eventMine: this.eventosService
        .findMineReservations()
        .pipe(catchError(() => of([]))),
      mine: this.reservasService.findMine().pipe(catchError(() => of([] as ReservaDetallada[]))),
    })
      .pipe(
        take(1),
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: ({ sessions, events, profile, eventMine, mine }) => {
          const safeSessions = Array.isArray(sessions) ? sessions : [];
          const safeEvents = Array.isArray(events) ? events : [];
          const myIds = new Set(
            mine
              .map((reservation) => reservation.sessionId ?? reservation.session?.id)
              .filter((id): id is number => typeof id === 'number'),
          );
          const myEventIds = new Set(
            eventMine
              .map((reservation) => reservation.eventId ?? reservation.event?.id)
              .filter((id): id is number => typeof id === 'number'),
          );

          this.sessions.set(safeSessions);
          this.events.set(safeEvents);
          this.profile.set(profile);
          this.myReservationSessionIds.set(myIds);
          this.myReservationEventIds.set(myEventIds);
          this.loadCounts(safeSessions);
          this.loadEventCounts(safeEvents);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar los horarios.');
        },
      });
  }

  reserve(session: SesionDetallada): void {
    if (this.actionSessionId()) {
      return;
    }

    const isReserved = this.isReserved(session.id);

    if (!isReserved) {
      if (!this.hasActivePlan()) {
        this.noticeMessage.set('Necesitas una cuota activa para reservar clases.');
        return;
      }

      if (this.isSessionAfterMembershipExpiration(session)) {
        this.noticeMessage.set(
          'No puedes reservar clases posteriores a la caducidad de tu cuota.',
        );
        return;
      }

      if (!this.hasAvailableAttendance()) {
        this.noticeMessage.set('No te quedan asistencias disponibles en tu cuota.');
        return;
      }
    }

    this.actionSessionId.set(session.id);
    this.errorMessage.set('');

    const request = isReserved
      ? this.reservasService.cancel(session.id)
      : this.reservasService.create(session.id);

    request
      .pipe(
        take(1),
        finalize(() => {
          this.actionSessionId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.setReserved(session.id, !isReserved);
          this.updateUsedClasses(isReserved ? -1 : 1);
          this.refreshCount(session.id);
          this.refreshParticipantsIfOpen(session.id);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || 'No se pudo actualizar la reserva.',
          );
        },
      });
  }

  openParticipants(sessionId: number): void {
    this.participantsModalSessionId.set(sessionId);
    this.loadParticipants(sessionId);
  }

  closeParticipants(): void {
    this.participantsModalSessionId.set(null);
  }

  reserveEvent(event: Evento): void {
    if (this.actionEventId()) {
      return;
    }

    const isReserved = this.isEventReserved(event.id);

    if (!isReserved) {
      const notice = this.getReservationRestrictionNotice({
        startsAt: this.getEventStartAt(event),
        capacity: event.capacity,
        reservedCount: this.eventParticipantCount(event.id),
        type: 'evento',
      });

      if (notice) {
        this.noticeMessage.set(notice);
        return;
      }
    }

    this.actionEventId.set(event.id);
    this.errorMessage.set('');

    const request = isReserved
      ? this.eventosService.cancelReservation(event.id)
      : this.eventosService.reserve(event.id);

    request
      .pipe(
        take(1),
        finalize(() => {
          this.actionEventId.set(null);
        }),
      )
      .subscribe({
        next: () => {
          this.setEventReserved(event.id, !isReserved);
          this.updateUsedClasses(isReserved ? -1 : 1);
          this.refreshEventCount(event.id);
        },
        error: (error) => {
          this.noticeMessage.set(
            error?.error?.message || 'No se pudo actualizar la reserva del evento.',
          );
        },
      });
  }

  closeNotice(): void {
    this.noticeMessage.set('');
  }

  isReserved(sessionId: number): boolean {
    return this.myReservationSessionIds().has(sessionId);
  }

  isEventReserved(eventId: number): boolean {
    return this.myReservationEventIds().has(eventId);
  }

  participantCount(sessionId: number): number {
    return this.reservationCounts()[sessionId] ?? 0;
  }

  freeSlots(session: SesionDetallada): number {
    return Math.max(this.capacity(session) - this.participantCount(session.id), 0);
  }

  eventParticipantCount(eventId: number): number {
    return this.eventReservationCounts()[eventId] ?? 0;
  }

  freeEventSlots(event: Evento): number {
    return Math.max(event.capacity - this.eventParticipantCount(event.id), 0);
  }

  hasSessionStarted(session: SesionDetallada): boolean {
    const date = session.date.slice(0, 10);
    const startAt = new Date(`${date}T${session.startTime}:00`);

    return startAt <= new Date();
  }

  hasEventStarted(event: Evento): boolean {
    return this.getEventStartAt(event) <= new Date();
  }

  isSessionAfterMembershipExpiration(session: SesionDetallada): boolean {
    const expiresAt = this.membershipExpiresAt();

    if (!expiresAt) {
      return false;
    }

    return this.getSessionStartAt(session) >= new Date(expiresAt);
  }

  isEventAfterMembershipExpiration(event: Evento): boolean {
    const expiresAt = this.membershipExpiresAt();

    if (!expiresAt) {
      return false;
    }

    return this.getEventStartAt(event) >= new Date(expiresAt);
  }

  capacity(session: SesionDetallada): number {
    return Number((session as any)?.maxCapacity ?? session.schedule?.maxCapacity ?? 0);
  }

  className(session: SesionDetallada): string {
    return this.classNameValue(session) || 'Clase';
  }

  classLevel(session: SesionDetallada): string {
    return session.classLevel ?? session.schedule?.class?.level ?? '';
  }

  instructorName(session: SesionDetallada): string {
    return session.instructor || 'Instructor';
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.trim().slice(0, 1))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CL';
  }

  participantName(reservation: ReservaDetallada): string {
    const user = reservation.user;
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

    return fullName || user?.name || user?.email || 'Participante';
  }

  selectTab(tabId: string): void {
    const routes: Record<string, string> = {
      dashboard: '/panel-admin',
      clases: '/clases',
      miembros: '/miembros',
      eventos: '/eventos',
      anuncios: '/anuncios',
    };

    void this.router.navigate([routes[tabId] ?? '/panel-admin']);
  }

  goToHome(): void {
    void this.router.navigate([this.isAdmin() ? '/panel-admin' : '/horarios']);
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

  private loadCounts(sessions: SesionDetallada[]): void {
    if (sessions.length === 0) {
      this.reservationCounts.set({});
      return;
    }

    forkJoin(
      sessions.map((session) =>
        this.reservasService.countForSession(session.id).pipe(
          catchError(() => of({ sessionId: session.id, count: 0 })),
        ),
      ),
    )
      .pipe(take(1))
      .subscribe((counts) => {
        this.reservationCounts.set(
          counts.reduce<Record<number, number>>((acc, item) => {
            acc[item.sessionId] = item.count;
            return acc;
          }, {}),
        );
      });
  }

  private loadEventCounts(events: Evento[]): void {
    const selectedEvents = events.filter(
      (event) => this.getDateKey(event.eventDate) === this.selectedDate(),
    );

    if (selectedEvents.length === 0) {
      this.eventReservationCounts.set({});
      return;
    }

    forkJoin(
      selectedEvents.map((event) =>
        this.eventosService.countReservations(event.id).pipe(
          catchError(() => of({ eventId: event.id, count: 0 })),
        ),
      ),
    )
      .pipe(take(1))
      .subscribe((counts) => {
        this.eventReservationCounts.set(
          counts.reduce<Record<number, number>>((acc, item) => {
            acc[item.eventId] = item.count;
            return acc;
          }, {}),
        );
      });
  }

  private refreshCount(sessionId: number): void {
    this.reservasService
      .countForSession(sessionId)
      .pipe(take(1), catchError(() => of({ sessionId, count: 0 })))
      .subscribe((counter) => {
        this.reservationCounts.set({
          ...this.reservationCounts(),
          [counter.sessionId]: counter.count,
        });
      });
  }

  private refreshEventCount(eventId: number): void {
    this.eventosService
      .countReservations(eventId)
      .pipe(take(1), catchError(() => of({ eventId, count: 0 })))
      .subscribe((counter) => {
        this.eventReservationCounts.set({
          ...this.eventReservationCounts(),
          [counter.eventId]: counter.count,
        });
      });
  }

  private loadParticipants(sessionId: number): void {
    this.loadingParticipants.set(sessionId);

    this.reservasService
      .findBySession(sessionId)
      .pipe(
        take(1),
        finalize(() => {
          this.loadingParticipants.set(null);
        }),
      )
      .subscribe({
        next: (participants) => {
          this.participantsBySession.set({
            ...this.participantsBySession(),
            [sessionId]: participants,
          });
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar los participantes.');
        },
      });
  }

  private refreshParticipantsIfOpen(sessionId: number): void {
    if (this.participantsModalSessionId() === sessionId) {
      this.loadParticipants(sessionId);
    }
  }

  private setReserved(sessionId: number, reserved: boolean): void {
    const reservations = new Set(this.myReservationSessionIds());

    if (reserved) {
      reservations.add(sessionId);
    } else {
      reservations.delete(sessionId);
    }

    this.myReservationSessionIds.set(reservations);
  }

  private setEventReserved(eventId: number, reserved: boolean): void {
    const reservations = new Set(this.myReservationEventIds());

    if (reserved) {
      reservations.add(eventId);
    } else {
      reservations.delete(eventId);
    }

    this.myReservationEventIds.set(reservations);
  }

  private getReservationRestrictionNotice(options: {
    startsAt: Date;
    capacity: number;
    reservedCount: number;
    type: 'clase' | 'evento';
  }): string {
    if (options.startsAt <= new Date()) {
      return `No puedes reservar un ${options.type} que ya ha empezado o ya ha pasado.`;
    }

    if (options.reservedCount >= options.capacity) {
      return `No hay cupo disponible para este ${options.type}.`;
    }

    if (!this.hasActivePlan()) {
      return `Necesitas una cuota activa para reservar ${options.type === 'clase' ? 'clases' : 'eventos'}.`;
    }

    const expiresAt = this.membershipExpiresAt();

    if (expiresAt && options.startsAt >= new Date(expiresAt)) {
      return `No puedes reservar ${options.type === 'clase' ? 'clases' : 'eventos'} posteriores a la caducidad de tu cuota.`;
    }

    if (!this.hasAvailableAttendance()) {
      return 'No te quedan asistencias disponibles en tu cuota.';
    }

    return '';
  }

  private updateUsedClasses(delta: number): void {
    const profile = this.profile();
    const membership = profile?.membership;

    if (!profile || !membership) {
      return;
    }

    this.profile.set({
      ...profile,
      membership: {
        ...membership,
        usedClasses: Math.max(membership.usedClasses + delta, 0),
      },
    });
  }

  private getTodayInputDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getEventsForSelectedDate(): Evento[] {
    return this.events().filter(
      (event) => this.getDateKey(event.eventDate) === this.selectedDate(),
    );
  }

  private timeRangesOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ): boolean {
    const startAMin = this.timeToMinutes(startA);
    const endAMin = this.timeToMinutes(endA);
    const startBMin = this.timeToMinutes(startB);
    const endBMin = this.timeToMinutes(endB);

    return startAMin < endBMin && startBMin < endAMin;
  }

  private timeToMinutes(value: string): number {
    const [hours, minutes] = String(value ?? '').split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  private getSessionStartAt(session: SesionDetallada): Date {
    const date = session.date.slice(0, 10);
    return new Date(`${date}T${session.startTime}:00`);
  }

  private getEventStartAt(event: Evento): Date {
    const date = this.getDateKey(event.eventDate);
    return new Date(`${date}T${event.startTime}:00`);
  }

  private getDateKey(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value ?? '').split('T')[0];
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private classNameValue(session: SesionDetallada): string {
    return session.className ?? session.schedule?.class?.name ?? '';
  }
}
