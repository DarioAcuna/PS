import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  nombreUsuario = '';
  apellidosUsuario = '';
  emailUsuario = '';
  passwordUsuario = '';
  cargando = false;
  mensajeError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  // Validar que el email sea válido
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Validar contrasena segun backend (min 12, mayusculas, minusculas y numeros, sin espacios)
  validarPassword(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{12,}$/;
    return regex.test(password);
  }

  registrar() {
    this.mensajeError = '';

    if (!this.nombreUsuario.trim()) {
      this.mensajeError = 'Por favor ingresa tu nombre';
      return;
    }

    if (!this.apellidosUsuario.trim()) {
      this.mensajeError = 'Por favor ingresa tus apellidos';
      return;
    }

    if (!this.emailUsuario.trim()) {
      this.mensajeError = 'Por favor ingresa un email';
      return;
    }

    if (!this.validarEmail(this.emailUsuario)) {
      this.mensajeError = 'El email no es válido';
      return;
    }

    if (!this.passwordUsuario) {
      this.mensajeError = 'Por favor ingresa una contraseña';
      return;
    }

    if (!this.validarPassword(this.passwordUsuario)) {
      this.mensajeError =
        'La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas y números, y no contener espacios.';
      return;
    }

    this.cargando = true;

    this.authService
      .register({
        firstName: this.nombreUsuario.trim(),
        lastName: this.apellidosUsuario.trim(),
        email: this.emailUsuario.trim(),
        password: this.passwordUsuario,
        belt: 'BLANCO',
        beltDegree: 0,
        memberType: 'ALUMNO',
        status: 'ACTIVO',
      })
      .pipe(
        finalize(() => {
          this.cargando = false;
        }),
      )
      .subscribe({
        next: () => {
          alert('¡Cuenta creada! Ahora inicia sesión');
          this.router.navigate(['/login']);
        },
        error: (error: any) => {
          this.mensajeError =
            error?.error?.message || 'Error al crear la cuenta. Intenta de nuevo.';
        },
      });
  }
}
