import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { PagosService } from '../../services/pagos/pagos.service';
import { PaymentPlanId } from '../../services/pagos/pagos.models';
import { AdminHeaderComponent } from '../../shared/admin-header/admin-header';
import { RoleFooterComponent } from '../../shared/role-footer/role-footer';

type HeaderTab = 'dashboard' | 'clases' | 'miembros' | 'eventos' | 'anuncios';

interface HeaderNavItem {
  id: HeaderTab;
  label: string;
}

interface PaymentPlan {
  id: PaymentPlanId;
  title: string;
  price: string;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-pago',
  standalone: true,
  imports: [CommonModule, AdminHeaderComponent, RoleFooterComponent],
  templateUrl: './pago.html',
  styleUrl: './pago.css',
})
export class PagoComponent implements OnInit {
  private readonly pagosService = inject(PagosService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly selectedTab = '';
  readonly navItems: HeaderNavItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clases', label: 'Clases' },
    { id: 'miembros', label: 'Miembros' },
    { id: 'eventos', label: 'Eventos' },
    { id: 'anuncios', label: 'Anuncios' },
  ];

  readonly plans: PaymentPlan[] = [
    {
      id: 'mensual',
      title: 'Cuota mensual',
      price: '39 EUR / mes',
      description: 'Para entrenar de forma regular cada mes.',
      features: ['Clases regulares', 'Reservas desde la app', 'Pago mensual'],
    },
    {
      id: 'premium',
      title: 'Cuota premium',
      price: '59 EUR / mes',
      description: 'Para usuarios que quieren prioridad y mas flexibilidad.',
      features: ['Prioridad en reservas', 'Clases regulares', 'Pago mensual'],
    },
    {
      id: 'familiar',
      title: 'Cuota familiar',
      price: '99 EUR / mes',
      description: 'Para agrupar miembros de una misma familia.',
      features: ['Cuota conjunta', 'Reservas desde la app', 'Pago mensual'],
    },
  ];

  readonly loadingPlanId = signal<PaymentPlanId | null>(null);
  readonly errorMessage = signal('');
  readonly resultMessage = signal('');
  readonly isAdmin = computed(() => this.authService.isAdmin());

  ngOnInit(): void {
    const result = this.route.snapshot.queryParamMap.get('resultado');
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (result === 'success' && sessionId) {
      this.resultMessage.set(
        'Pago de prueba completado. Actualizando tu cuota...',
      );
      this.confirmCheckoutSession(sessionId);
      return;
    }

    if (result === 'success') {
      this.resultMessage.set('Pago de prueba completado.');
    }

    if (result === 'cancel') {
      this.resultMessage.set(
        'Pago cancelado. Puedes elegir una cuota cuando quieras.',
      );
    }
  }

  startCheckout(planId: PaymentPlanId): void {
    this.errorMessage.set('');
    this.resultMessage.set('');
    this.loadingPlanId.set(planId);

    this.pagosService
      .createCheckoutSession({ planId })
      .pipe(finalize(() => this.loadingPlanId.set(null)))
      .subscribe({
        next: ({ url }) => {
          window.location.href = url;
        },
        error: (error) => {
          this.errorMessage.set(this.getCheckoutErrorMessage(error));
        },
      });
  }

  selectTab(tab: string): void {
    const routes: Record<HeaderTab, string> = {
      dashboard: '/panel-admin',
      clases: '/clases',
      miembros: '/miembros',
      eventos: '/eventos',
      anuncios: '/anuncios',
    };

    this.router.navigate([routes[tab as HeaderTab]]);
  }

  goToHome(): void {
    this.router.navigate(['/panel-admin']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  private confirmCheckoutSession(sessionId: string): void {
    this.pagosService.confirmCheckoutSession({ sessionId }).subscribe({
      next: ({ planName, monthlyClassLimit }) => {
        this.resultMessage.set(
          `Cuota activada: ${planName}. Tienes ${monthlyClassLimit} clases al mes.`,
        );
      },
      error: (error) => {
        this.errorMessage.set(this.getCheckoutErrorMessage(error));
      },
    });
  }

  private getCheckoutErrorMessage(error: any): string {
    if (error?.status === 0) {
      return 'No se pudo conectar con el backend. Revisa que el servidor esté arrancado en localhost:3000.';
    }

    if (error?.error?.message) {
      return Array.isArray(error.error.message)
        ? error.error.message.join(' ')
        : error.error.message;
    }

    return 'No se pudo abrir la pasarela de pago de prueba.';
  }
}
