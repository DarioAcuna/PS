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
  UsuarioRol,
} from '../../services/usuarios/usuarios.models';
type HeaderTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';
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
  readonly showEditModal = signal(false);
  readonly isSaving = signal(false);
  readonly editErrorMessage = signal('');
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
  readonly filteredUsuarios = computed(() => {
    const { name, belt, beltDegree, status } = this.filterForm.getRawValue();
    const query = (name ?? '').trim().toLowerCase();
    const beltFilter = (belt ?? '').trim().toLowerCase();
    const degreeFilter = (beltDegree ?? '').trim();
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
      const degreeValue = usuario.beltDegree;
      const degreeMatch = !degreeFilter || (degreeValue !== null && degreeValue.toString() === degreeFilter);
      const statusMatch = !statusFilter || usuario.status === statusFilter;
      return nameMatch && beltMatch && degreeMatch && statusMatch;
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
  readonly beltDegreeOptions = computed(() => {
    const degrees = new Set<number>();
    this.usuarios().forEach((usuario) => {
      if (usuario.beltDegree !== null && usuario.beltDegree !== undefined) {
        degrees.add(usuario.beltDegree);
      }
    });
    return Array.from(degrees).sort((a, b) => a - b);
  });
  readonly selectedUser = computed(() => {
    const currentId = this.selectedUserId();
    return this.usuarios().find((usuario) => usuario.id === currentId) ?? null;
  });
  readonly roleOptions: UsuarioRol[] = ['ADMIN', 'PROFESOR', 'ALUMNO'];
  readonly statusOptions: UsuarioEstado[] = ['ACTIVO', 'INACTIVO'];
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
    });
    this.editForm = this.formBuilder.nonNullable.group({
      firstName: ['', [Validators.required, Validators.minLength(1)]],
      lastName: ['', [Validators.required, Validators.minLength(1)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['ALUMNO' as UsuarioRol, Validators.required],
      belt: [''],
      beltDegree: [null as number | null],
      status: ['ACTIVO' as UsuarioEstado, Validators.required],
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
      beltDegree: '',
      status: '',
    });
  }
  selectUser(id: number): void {
    this.selectedUserId.set(id);
  }
  openEditModal(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.editForm.patchValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      belt: user.belt || '',
      beltDegree: user.beltDegree,
      status: user.status,
    });
    this.editErrorMessage.set('');
    this.showEditModal.set(true);
  }
  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editErrorMessage.set('');
  }
  saveEdit(): void {
    if (this.editForm.invalid) {
      this.editErrorMessage.set('Por favor completa todos los campos requeridos');
      return;
    }
    const user = this.selectedUser();
    if (!user) return;
    this.isSaving.set(true);
    this.editErrorMessage.set('');
    const formValue = this.editForm.getRawValue();
    this.usuariosService
      .update(user.id, {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        role: formValue.role,
        belt: formValue.belt || undefined,
        beltDegree: formValue.beltDegree || undefined,
        status: formValue.status,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: (updatedUser) => {
          const usuarios = this.usuarios();
          const index = usuarios.findIndex(u => u.id === user.id);
          if (index !== -1) {
            usuarios[index] = updatedUser;
            this.usuarios.set([...usuarios]);
          }
          this.closeEditModal();
        },
        error: (error) => {
          const message = error?.error?.message || 'Error al guardar los cambios';
          this.editErrorMessage.set(message);
        },
      });
  }
  deleteUser(): void {
    const user = this.selectedUser();
    if (!user) return;
    const confirmDelete = confirm(
      `¿Estás seguro de que deseas eliminar a ${user.firstName || user.name}? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;
    this.isSaving.set(true);
    this.editErrorMessage.set('');
    this.usuariosService
      .remove(user.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isSaving.set(false);
        }),
      )
      .subscribe({
        next: () => {
          const usuarios = this.usuarios().filter(u => u.id !== user.id);
          this.usuarios.set(usuarios);
          this.selectedUserId.set(null);
          this.closeEditModal();
        },
        error: (error) => {
          const message = error?.error?.message || 'Error al eliminar el miembro';
          this.editErrorMessage.set(message);
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
      void this.router.navigate(['/panel-admin']);
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
