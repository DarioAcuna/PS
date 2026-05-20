import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupFormListener();
  }

  private setupFormListener(): void {
    const form = document.getElementById('formularioLogin') as HTMLFormElement;

    if (form) {
      form.addEventListener('submit', (e) => this.onSubmit(e));
    }
  }

  private onSubmit(event: Event): void {
    event.preventDefault();

    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      this.showError('Por favor completa todos los campos');
      return;
    }

    this.isLoading = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cargando...';

    this.authService.login(email, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('✅ Login exitoso:', response.user);
          // Redirigir a la pantalla de clases
          this.router.navigate(['/horarios']);
        },
        error: (error) => {
          this.isLoading = false;
          submitBtn.disabled = false;
          submitBtn.textContent = 'INICIAR SESIÓN';

          const message = error?.error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
          this.showError(message);
          console.error('❌ Error de login:', error);
        }
      });
  }

  private showError(message: string): void {
    const errorContainer = document.getElementById('errorContainer') as HTMLDivElement;

    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';

      // Limpiar el error después de 5 segundos
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 5000);
    }
  }

  irASignup(): void {
    this.router.navigate(['/signup']);
  }

  /**
   * Logout - Limpia la cookie httpOnly y la sesión
   */
  logout(): void {
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('✅ Logout exitoso');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('❌ Error en logout:', err);
          // Aún así redirige a login aunque haya error
          this.router.navigate(['/login']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
