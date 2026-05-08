import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import {
  CreateEventoDto,
  Evento,
  UpdateEventoDto,
} from '../../services/eventos/eventos.models';
import { EventosService } from '../../services/eventos/eventos.service';
import { FooterComponent } from '../../shared/admin-footer/admin-footer';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';

type HeaderTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface HeaderNavItem {
  id: HeaderTab;
  label: string;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminHeaderComponent, FooterComponent],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class EventosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly eventos = signal<Evento[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<number | null>(null);
  readonly selectedEvent = signal<Evento | null>(null);
  readonly originalEvent = signal<Evento | null>(null);
  readonly selectedTab: HeaderTab = 'eventos';
  readonly navItems: HeaderNavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  readonly upcomingCount = computed(() => {
    const today = this.getStartOfToday();
    return this.eventos().filter((evento) => this.getEventDate(evento) >= today).length;
  });
  readonly pastCount = computed(() => this.eventos().length - this.upcomingCount());
  readonly nextEvent = computed(() => {
    const today = this.getStartOfToday();
    return (
      [...this.eventos()]
        .filter((evento) => this.getEventDate(evento) >= today)
        .sort((a, b) => this.getEventDate(a).getTime() - this.getEventDate(b).getTime())[0]
        ?.name ?? 'Sin eventos'
    );
  });

  readonly eventoForm;

  constructor(
    private readonly eventosService: EventosService,
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    this.eventoForm = this.formBuilder.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      eventDate: [this.getTodayInputDate(), [Validators.required]],
      capacity: [20, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.loadEventos();
  }

  loadEventos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.eventosService
      .findAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (eventos) => {
          this.eventos.set(Array.isArray(eventos) ? eventos : []);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar los eventos.');
        },
      });
  }

  submit(): void {
    if (this.isSaving()) {
      return;
    }

    if (this.eventoForm.invalid) {
      this.eventoForm.markAllAsTouched();
      this.errorMessage.set('Nombre, descripcion, fecha y capacidad son obligatorios.');
      return;
    }

    const payload = this.buildPayload();

    if (!payload) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.editingId() === null) {
      this.createEvento(payload as CreateEventoDto);
      return;
    }

    this.updateEvento(this.editingId() as number, payload);
  }

  startCreate(): void {
    this.editingId.set(null);
    this.originalEvent.set(null);
    this.selectedEvent.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.eventoForm.reset({
      name: '',
      description: '',
      eventDate: this.getTodayInputDate(),
      capacity: 20,
    });
  }

  startEdit(evento: Evento): void {
    this.editingId.set(evento.id);
    this.originalEvent.set({ ...evento });
    this.selectedEvent.set(evento);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.eventoForm.reset({
      name: evento.name,
      description: evento.description,
      eventDate: this.toInputDate(evento.eventDate),
      capacity: evento.capacity,
    });
  }

  viewEvent(evento: Evento): void {
    this.selectedEvent.set(evento);
  }

  clearForm(): void {
    const original = this.originalEvent();

    if (this.editingId() !== null && original) {
      this.eventoForm.reset({
        name: original.name,
        description: original.description,
        eventDate: this.toInputDate(original.eventDate),
        capacity: original.capacity,
      });
      this.errorMessage.set('');
      this.successMessage.set('');
      return;
    }

    this.startCreate();
  }

  remove(evento: Evento): void {
    const confirmed = window.confirm(`Quieres eliminar el evento "${evento.name}"?`);

    if (!confirmed) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.eventosService
      .remove(evento.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Evento eliminado correctamente.');

          if (this.editingId() === evento.id) {
            this.startCreate();
          }

          if (this.selectedEvent()?.id === evento.id) {
            this.selectedEvent.set(null);
          }

          this.loadEventos();
        },
        error: (error) => {
          const backendMessage = Array.isArray(error?.error?.message)
            ? error.error.message.join(', ')
            : error?.error?.message;
          this.errorMessage.set(backendMessage || 'No se pudo eliminar el evento.');
        },
      });
  }

  trackById(_: number, evento: Evento): number {
    return evento.id;
  }

  formatDate(value: string): string {
    const date = this.getDateFromValue(value);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  goToHome(): void {
    void this.router.navigate(['/panel-admin']);
  }

  selectTab(tabId: string): void {
    if (tabId === 'dashboard') {
      void this.router.navigate(['/panel-admin']);
      return;
    }

    if (tabId === 'clases') {
      void this.router.navigate(['/clases']);
      return;
    }

    if (tabId === 'miembros') {
      void this.router.navigate(['/miembros']);
      return;
    }

    if (tabId === 'eventos') {
      void this.router.navigate(['/eventos']);
      return;
    }

    if (tabId === 'anuncios') {
      void this.router.navigate(['/anuncios']);
      return;
    }

    void this.router.navigate(['/panel-admin']);
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createEvento(payload: CreateEventoDto): void {
    this.eventosService
      .create(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Evento creado correctamente.');
          this.startCreate();
          this.loadEventos();
        },
        error: (error) => {
          this.errorMessage.set(this.getBackendMessage(error, 'No se pudo crear el evento.'));
        },
      });
  }

  private updateEvento(id: number, payload: UpdateEventoDto): void {
    this.eventosService
      .update(id, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Evento actualizado correctamente.');
          this.startCreate();
          this.loadEventos();
        },
        error: (error) => {
          this.errorMessage.set(this.getBackendMessage(error, 'No se pudo actualizar el evento.'));
        },
      });
  }

  private buildPayload(): CreateEventoDto | UpdateEventoDto | null {
    const raw = this.eventoForm.getRawValue();
    const name = raw.name.trim();
    const description = raw.description.trim();
    const [year, month, day] = raw.eventDate.split('-').map(Number);
    const capacity = Number(raw.capacity);

    if (!name || !description) {
      this.errorMessage.set('Nombre y descripcion son obligatorios.');
      return null;
    }

    if (!year || !month || !day) {
      this.errorMessage.set('La fecha del evento no es valida.');
      return null;
    }

    if (!Number.isInteger(capacity) || capacity < 1) {
      this.errorMessage.set('La capacidad debe ser mayor que cero.');
      return null;
    }

    return {
      name,
      description,
      day,
      month,
      year,
      capacity,
    };
  }

  private getBackendMessage(error: any, fallback: string): string {
    const backendMessage = Array.isArray(error?.error?.message)
      ? error.error.message.join(', ')
      : error?.error?.message;

    return backendMessage || fallback;
  }

  private getTodayInputDate(): string {
    return this.toInputDate(new Date().toISOString());
  }

  private toInputDate(value: string): string {
    const date = this.getDateFromValue(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private getEventDate(evento: Evento): Date {
    return this.getDateFromValue(evento.eventDate);
  }

  private getDateFromValue(value: string): Date {
    const datePart = String(value ?? '').split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);

    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
}
