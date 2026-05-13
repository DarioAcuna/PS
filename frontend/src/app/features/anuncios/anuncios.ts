import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AnunciosService } from '../../services/anuncios/anuncios.service';
import {
  Anuncio,
  CreateAnuncioDto,
  UpdateAnuncioDto,
} from '../../services/anuncios/anuncios.models';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { RoleFooterComponent } from '../../shared/role-footer/role-footer';
import { AuthService } from '../../services/auth/auth.service';

type HeaderTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface HeaderNavItem {
  id: HeaderTab;
  label: string;
}

@Component({
  selector: 'app-anuncios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminHeaderComponent, RoleFooterComponent],
  templateUrl: './anuncios.html',
  styleUrl: './anuncios.css',
})
export class AnunciosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly anuncios = signal<Anuncio[]>([]);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly editingId = signal<number | null>(null);
  readonly originalAnuncio = signal<Anuncio | null>(null);
  readonly activeCount = computed(() => this.anuncios().filter((anuncio) => anuncio.isActive).length);
  readonly inactiveCount = computed(() => this.anuncios().length - this.activeCount());
  readonly selectedTab: HeaderTab = 'anuncios';
  readonly navItems: HeaderNavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  anuncioForm;

  constructor(
    private readonly anunciosService: AnunciosService,
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    this.anuncioForm = this.formBuilder.nonNullable.group({
      title: ['', [Validators.required, Validators.maxLength(120)]],
      content: ['', [Validators.required, Validators.maxLength(2000)]],
      isActive: true,
    });
  }

  ngOnInit(): void {
    this.isSaving.set(false);
    this.loadAnuncios();
  }

  loadAnuncios(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.anunciosService
      .findAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (anuncios) => {
          this.anuncios.set(anuncios);
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar los anuncios.');
        },
      });
  }

  submit(): void {
    if (this.isSaving()) {
      return;
    }

    if (this.anuncioForm.invalid) {
      this.anuncioForm.markAllAsTouched();
      this.errorMessage.set('Titulo y contenido son obligatorios.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payloadBase = this.anuncioForm.getRawValue();
    const payload = {
      title: payloadBase.title.trim(),
      content: payloadBase.content.trim(),
      isActive: payloadBase.isActive,
    };

    if (!payload.title || !payload.content) {
      this.isSaving.set(false);
      this.errorMessage.set('Titulo y contenido son obligatorios.');
      return;
    }

    if (this.editingId() === null) {
      this.createAnuncio(payload);
      return;
    }

    this.updateAnuncio(this.editingId() as number, payload);
  }

  startCreate(): void {
    this.editingId.set(null);
    this.originalAnuncio.set(null);
    this.isSaving.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.anuncioForm.reset({
      title: '',
      content: '',
      isActive: true,
    });
  }

  startEdit(anuncio: Anuncio): void {
    this.editingId.set(anuncio.id);
    this.originalAnuncio.set({ ...anuncio });
    this.successMessage.set('');
    this.errorMessage.set('');
    this.anuncioForm.patchValue({
      title: anuncio.title,
      content: anuncio.content,
      isActive: anuncio.isActive,
    });
  }

  clearForm(): void {
    if (this.editingId() !== null && this.originalAnuncio()) {
      const original = this.originalAnuncio() as Anuncio;
      this.successMessage.set('');
      this.errorMessage.set('');
      this.anuncioForm.reset({
        title: original.title,
        content: original.content,
        isActive: original.isActive,
      });
      return;
    }

    this.startCreate();
  }

  remove(id: number): void {
    const confirmed = window.confirm('Quieres eliminar este anuncio?');
    if (!confirmed) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.anunciosService
      .remove(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Anuncio eliminado correctamente.');
          this.loadAnuncios();
        },
        error: () => {
          this.errorMessage.set('No se pudo eliminar el anuncio.');
        },
      });
  }

  trackById(_: number, anuncio: Anuncio): number {
    return anuncio.id;
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

    if (tabId === 'anuncios') {
      void this.router.navigate(['/anuncios']);
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

    // Secciones no implementadas aún: llevamos al panel principal.
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

  private createAnuncio(payload: CreateAnuncioDto): void {
    this.anunciosService
      .create(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Anuncio creado correctamente.');
          this.startCreate();
          this.loadAnuncios();
        },
        error: () => {
          this.errorMessage.set('No se pudo crear el anuncio.');
        },
      });
  }

  private updateAnuncio(id: number, payload: UpdateAnuncioDto): void {
    this.anunciosService
      .update(id, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage.set('Anuncio actualizado correctamente.');
          this.startCreate();
          this.loadAnuncios();
        },
        error: () => {
          this.errorMessage.set('No se pudo actualizar el anuncio.');
        },
      });
  }
}
