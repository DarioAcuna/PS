import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../services/auth/auth.models';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { RoleFooterComponent } from '../../shared/role-footer/role-footer';

type HeaderTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface HeaderNavItem {
  id: HeaderTab;
  label: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent, RoleFooterComponent],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  readonly user = signal<User | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly selectedTab = '';
  readonly navItems: HeaderNavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  readonly isAdmin = computed(() => this.authService.isAdminUser(this.user()));
  readonly displayName = computed(() => {
    const user = this.user();
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

    return fullName || user?.name || 'Usuario';
  });

  readonly beltName = computed(() => this.user()?.belt?.trim() || 'Sin cinturon');
  readonly beltDegree = computed(() => this.user()?.beltDegree ?? 0);
  readonly beltClass = computed(() => {
    const belt = this.normalizeBelt(this.user()?.belt);

    return `belt-${belt}`;
  });

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .getProfile()
      .pipe(take(1))
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.isLoading.set(false);
        },
        error: () => {
          const fallback = this.authService.getCurrentUser();
          this.user.set(fallback);
          this.errorMessage.set('No se pudo actualizar el perfil con los datos del servidor.');
          this.isLoading.set(false);
        },
      });
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
    void this.router.navigate([this.isAdmin() ? '/panel-admin' : '/perfil']);
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

  roleLabel(role?: string | null): string {
    if (role === 'ADMIN') {
      return 'Administrador';
    }

    if (role === 'PROFESOR') {
      return 'Profesor';
    }

    return 'Alumno';
  }

  statusLabel(status?: string | null): string {
    return status === 'INACTIVO' ? 'Inactivo' : 'Activo';
  }

  formatBelt(user: User): string {
    const belt = user.belt?.trim();
    const degree = user.beltDegree;

    if (!belt && (degree === null || degree === undefined)) {
      return 'Sin informacion';
    }

    if (!belt) {
      return `Grado ${degree}`;
    }

    if (degree === null || degree === undefined) {
      return belt;
    }

    return `${belt} - grado ${degree}`;
  }

  getDegreeStripes(degree: number): number[] {
    const normalizedDegree = Math.min(Math.max(Number(degree) || 0, 0), 4);

    return Array.from({ length: normalizedDegree }, (_, index) => 58 + index * 7);
  }

  trainingSince(value?: string): string {
    if (!value) {
      return 'No disponible';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'No disponible';
    }

    return date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'No disponible';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'No disponible';
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  private normalizeBelt(value?: string | null): string {
    const belt = String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (belt === 'azul') {
      return 'blue';
    }

    if (belt === 'morado') {
      return 'purple';
    }

    if (belt === 'marron') {
      return 'brown';
    }

    if (belt === 'negro') {
      return 'black';
    }

    return 'white';
  }
}
