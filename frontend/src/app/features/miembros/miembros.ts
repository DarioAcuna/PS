import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  UpdateUsuarioDto,
} from '../../services/usuarios/usuarios.models';

type HeaderTab = 'dashboard' | 'clases' | 'instructores' | 'miembros' | 'eventos' | 'anuncios';
type EstadoFiltro = '' | UsuarioEstado;
type TipoFiltro = '' | UsuarioTipo;

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
  readonly editingUser = signal<Usuario | null>(null);
  readonly editError = signal('');
  readonly isSaving = signal(false);
  readonly isAdminLocked = signal(false);
  readonly currentPage = signal(1);

  private readonly pageSize = 30;
  readonly beltOptions = ['BLANCO', 'AZUL', 'MORADO', 'MARRON', 'NEGRO'];

  readonly selectedTab: HeaderTab = 'miembros';
   readonly navItems: HeaderNavItem[] = [
     { id: 'dashboard', label: 'Dashboard' },
     { id: 'clases', label: 'Clases' },
     { id: 'miembros', label: 'Miembros' },
     { id: 'eventos', label: 'Eventos' },
     { id: 'anuncios', label: 'Anuncios' },
   ];

  readonly filterForm;
  readonly editForm;
  readonly filterSnapshot = signal({
    name: '',
    belt: '',
    beltDegree: '',
    status: '' as EstadoFiltro,
    memberType: '' as TipoFiltro,
  });

  readonly filteredUsuarios = computed(() => {
    const { name, belt, beltDegree, status, memberType } = this.filterSnapshot();
    const query = (name ?? '').trim().toLowerCase();
    const beltFilter = (belt ?? '').trim().toUpperCase();
    const degreeFilter = (beltDegree ?? '').trim();
    const statusFilter = (status ?? '') as EstadoFiltro;
    const typeFilter = (memberType ?? '') as TipoFiltro;

    return this.usuarios()
      .filter((usuario) => {
        const fullName = `${usuario.firstName ?? ''} ${usuario.lastName ?? ''}`.trim();
        const nameValue = fullName || usuario.name || '';
        const nameMatch =
          !query ||
          nameValue.toLowerCase().includes(query) ||
          usuario.email.toLowerCase().includes(query);

        const beltValue = (usuario.belt ?? '').trim().toUpperCase();
        const beltMatch = !beltFilter || beltValue === beltFilter;

        const degreeValue = usuario.beltDegree;
        const degreeMatch =
          !degreeFilter || (degreeValue !== null && degreeValue.toString() === degreeFilter);

        const statusMatch = !statusFilter || usuario.status === statusFilter;

        const userType = usuario.role === 'PROFESOR'
          ? 'PROFESOR'
          : usuario.role === 'ALUMNO'
            ? 'ALUMNO'
            : 'ADMIN';
        const typeMatch = !typeFilter || userType === typeFilter;

        return nameMatch && beltMatch && degreeMatch && statusMatch && typeMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  readonly paginatedUsuarios = computed(() => {
    const page = this.currentPage();
    const all = this.filteredUsuarios();
    const start = (page - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() => {
    const total = this.filteredUsuarios().length;
    return Math.max(1, Math.ceil(total / this.pageSize));
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, index) => index + 1);
  });

  readonly beltDegreeOptions = computed(() => {
    const degrees = new Set<number>();

    this.usuarios().forEach((usuario) => {
      if (usuario.beltDegree !== null && usuario.beltDegree !== undefined) {
        degrees.add(usuario.beltDegree);
      }
    });

    return Array.from(degrees).sort((a, b) => a - b);
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
      beltDegree: '',
      status: '' as EstadoFiltro,
      memberType: '' as TipoFiltro,
    });

    this.editForm = this.formBuilder.nonNullable.group({
      firstName: '',
      lastName: '',
      email: '',
      belt: 'BLANCO',
      beltDegree: 0,
      memberType: 'ALUMNO' as UsuarioTipo,
      status: 'ACTIVO' as UsuarioEstado,
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
          this.currentPage.set(1);
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
       beltDegree: '',
       status: '',
       memberType: '',
     });
     this.applyFilters();
   }

   applyFilters(): void {
     const value = this.filterForm.getRawValue();
     this.filterSnapshot.set({
       name: value.name ?? '',
       belt: value.belt ?? '',
       beltDegree: value.beltDegree ?? '',
       status: value.status ?? ('' as EstadoFiltro),
       memberType: value.memberType ?? ('' as TipoFiltro),
     });
     this.currentPage.set(1);
   }

  setPage(page: number): void {
    const total = this.totalPages();
    const next = Math.min(Math.max(page, 1), total);
    this.currentPage.set(next);
  }

  openEdit(usuario: Usuario): void {
    this.editError.set('');
    this.editingUser.set(usuario);

    const isAdmin = usuario.role === 'ADMIN';
    this.isAdminLocked.set(isAdmin);

    const beltValue = (usuario.belt ?? 'BLANCO').trim().toUpperCase();

    this.editForm.reset({
      firstName: usuario.firstName ?? '',
      lastName: usuario.lastName ?? '',
      email: usuario.email,
      belt: this.beltOptions.includes(beltValue) ? beltValue : 'BLANCO',
      beltDegree: usuario.beltDegree ?? 0,
      memberType: usuario.role === 'PROFESOR' ? 'PROFESOR' : 'ALUMNO',
      status: usuario.status,
    });

    if (isAdmin) {
      this.editForm.controls.email.disable();
      this.editForm.controls.memberType.disable();
      this.editForm.controls.status.disable();
    } else {
      this.editForm.enable();
    }
  }

  closeEdit(): void {
    this.editingUser.set(null);
    this.isAdminLocked.set(false);
    this.editError.set('');
    this.editForm.enable();
  }

  saveEdit(): void {
    const current = this.editingUser();

    if (!current) {
      return;
    }

    const raw = this.editForm.getRawValue();
    const firstName = raw.firstName.trim();
    const lastName = raw.lastName.trim();
    const email = raw.email.trim();
    const belt = raw.belt.trim().toUpperCase();
    const beltDegree = Number(raw.beltDegree);

    if (firstName.length < 2 || lastName.length < 2) {
      this.editError.set('Nombre y apellidos deben tener al menos 2 caracteres.');
      return;
    }

    if (!email) {
      this.editError.set('El correo es obligatorio.');
      return;
    }

    if (!this.beltOptions.includes(belt)) {
      this.editError.set('El cinturon debe ser blanco, azul, morado, marron o negro.');
      return;
    }

    if (Number.isNaN(beltDegree) || beltDegree < 0 || beltDegree > 4) {
      this.editError.set('El grado debe estar entre 0 y 4.');
      return;
    }

    const payload: UpdateUsuarioDto = {};

    if (firstName !== (current.firstName ?? '')) {
      payload.firstName = firstName;
    }

    if (lastName !== (current.lastName ?? '')) {
      payload.lastName = lastName;
    }

    if (!this.isAdminLocked() && email !== current.email) {
      payload.email = email;
    }

    if (belt !== (current.belt ?? '').trim().toUpperCase()) {
      payload.belt = belt;
    }

    if (beltDegree !== (current.beltDegree ?? 0)) {
      payload.beltDegree = beltDegree;
    }

    if (!this.isAdminLocked()) {
      const originalMemberType = current.role === 'PROFESOR' ? 'PROFESOR' : 'ALUMNO';
      if (raw.memberType !== originalMemberType) {
        payload.memberType = raw.memberType;
      }

      if (raw.status !== current.status) {
        payload.status = raw.status;
      }
    }

    if (Object.keys(payload).length === 0) {
      this.closeEdit();
      return;
    }

    this.isSaving.set(true);
    this.editError.set('');

    this.usuariosService
      .update(current.id, payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (updated) => {
          const updatedList = this.usuarios().map((usuario) =>
            usuario.id === updated.id ? updated : usuario,
          );
          this.usuarios.set(updatedList);
          this.closeEdit();
        },
        error: (error) => {
          this.editError.set(
            error?.error?.message || 'No se pudieron guardar los cambios.',
          );
        },
      });
  }

  deleteUser(): void {
    const current = this.editingUser();

    if (!current) {
      return;
    }

    if (!confirm(`¿Seguro que quieres eliminar a ${current.name || current.email}?`)) {
      return;
    }

    if (!confirm('Esta accion no se puede deshacer. ¿Confirmas la eliminacion?')) {
      return;
    }

    this.isSaving.set(true);
    this.editError.set('');

    this.usuariosService
      .remove(current.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.usuarios.set(this.usuarios().filter((usuario) => usuario.id !== current.id));
          const total = this.totalPages();
          if (this.currentPage() > total) {
            this.currentPage.set(total);
          }
          this.closeEdit();
        },
        error: (error) => {
          this.editError.set(
            error?.error?.message || 'No se pudo eliminar el perfil.',
          );
        },
      });
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
