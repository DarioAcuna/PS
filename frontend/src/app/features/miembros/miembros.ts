import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { FooterComponent } from '../../shared/admin-footer/admin-footer';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { AuthService } from '../../services/auth/auth.service';
import { UsuariosService } from '../../services/usuarios/usuarios.service';
import {
  Usuario,
  UsuarioEstado,
  UsuarioTipo,
  CreateUsuarioDto,
} from '../../services/usuarios/usuarios.models';

type HeaderTab = 'dashboard' | 'clases' | 'instructores' | 'miembros' | 'eventos' | 'anuncios';

type EstadoFiltro = '' | UsuarioEstado;

interface HeaderNavItem {
  id: HeaderTab;
  label: string;
}

@Component({
  selector: 'app-miembros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminHeaderComponent, FooterComponent],
  templateUrl: './miembros.html',
  styleUrl: './miembros.css',
})
export class MiembrosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly usuarios = signal<Usuario[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly selectedUserId = signal<number | null>(null);
  readonly isCreateModalOpen = signal(false);
  readonly isCreating = signal(false);
  readonly createErrorMessage = signal('');

  readonly beltChoices = ['Blanco', 'Azul', 'Morado', 'Marron', 'Negro'];
  readonly selectedTab: HeaderTab = 'miembros';
  readonly navItems: HeaderNavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'instructores', label: 'Instructores' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  readonly filterForm;

  readonly createForm;

  readonly filteredUsuarios = computed(() => {
    const { name, belt, status } = this.filterForm.getRawValue();
    const query = (name ?? '').trim().toLowerCase();
    const beltFilter = (belt ?? '').trim().toLowerCase();
    const statusFilter = (status ?? '') as EstadoFiltro;

    return this.usuarios().filter((usuario) => {
      const fullName = `${usuario.firstName ?? ''} ${usuario.lastName ?? ''}`.trim();
      const nameValue = fullName || usuario.name || '';
      const nameMatch =
        !query ||
        nameValue.toLowerCase().includes(query) ||
        usuario.email.toLowerCase().includes(query);

      const beltValue = (usuario.belt ?? '').trim().toLowerCase();
      const beltMatch = !beltFilter || beltValue === beltFilter;

      const statusMatch = !statusFilter || usuario.status === statusFilter;

      return nameMatch && beltMatch && statusMatch;
    });
  });

  readonly beltOptions = computed(() => {
    const belts = new Set<string>();

    this.usuarios().forEach((usuario) => {
      if (usuario.belt) {
        belts.add(usuario.belt.trim());
      }
    });

    return Array.from(belts).sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly selectedUser = computed(() => {
    const currentId = this.selectedUserId();
    return this.usuarios().find((usuario) => usuario.id === currentId) ?? null;
  });

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    this.filterForm = this.formBuilder.nonNullable.group({
      name: '',
      belt: '',
      status: '' as EstadoFiltro,
    });

    this.createForm = this.formBuilder.nonNullable.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      belt: ['', [Validators.required]],
      beltDegree: [0, [Validators.required, Validators.min(0), Validators.max(4)]],
      memberType: ['ALUMNO' as UsuarioTipo, [Validators.required]],
      status: ['ACTIVO' as UsuarioEstado, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usuariosService
      .findAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          if (this.selectedUserId() === null && usuarios.length > 0) {
            this.selectedUserId.set(usuarios[0].id);
          }
        },
        error: () => {
          this.errorMessage.set('No se pudieron cargar los miembros.');
        },
      });
  }

  clearFilters(): void {
    this.filterForm.reset({
      name: '',
      belt: '',
      status: '',
    });
  }

  openCreateModal(): void {
    this.createErrorMessage.set('');
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreate(): void {
    if (this.isCreating()) {
      return;
    }

    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.createErrorMessage.set('');

    const payload = this.createForm.getRawValue();
    const dto: CreateUsuarioDto = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      belt: payload.belt.trim(),
      beltDegree: Number(payload.beltDegree),
      memberType: payload.memberType,
      status: payload.status,
    };

    this.usuariosService
      .create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isCreating.set(false);
        }),
      )
      .subscribe({
        next: (usuario) => {
          this.selectedUserId.set(usuario.id);
          this.closeCreateModal();
          this.createForm.reset({
            firstName: '',
            lastName: '',
            email: '',
            belt: '',
            beltDegree: 0,
            memberType: 'ALUMNO' as UsuarioTipo,
            status: 'ACTIVO' as UsuarioEstado,
          });
          this.loadUsuarios();
        },
        error: () => {
          this.createErrorMessage.set('No se pudo crear el miembro.');
        },
      });
  }

  selectUser(id: number): void {
    this.selectedUserId.set(id);
  }

  trackById(_: number, usuario: Usuario): number {
    return usuario.id;
  }

  goToHome(): void {
    void this.router.navigate(['/panel-admin']);
  }

  selectTab(tabId: string): void {
    if (tabId === 'dashboard') {
      void this.router.navigate(['/panel-admin']);
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
}

