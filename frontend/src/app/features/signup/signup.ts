import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  nombreUsuario = '';
  emailUsuario = '';
  passwordUsuario = '';
  cargando = false;
  mensajeError = '';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // Validar que el email sea válido
  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  // Validar que la contraseña tenga al menos 8 caracteres
  validarPassword(password: string): boolean {
    return password.length >= 8;
  }

  registrar() {
    this.mensajeError = '';

    // Validar campos vacíos
    if (!this.nombreUsuario.trim()) {
      this.mensajeError = 'Por favor ingresa un nombre de usuario';
      return;
    }

    if (!this.emailUsuario.trim()) {
      this.mensajeError = 'Por favor ingresa un email';
      return;
    }

    // Validar formato de email
    if (!this.validarEmail(this.emailUsuario)) {
      this.mensajeError = 'El email no es válido';
      return;
    }

    if (!this.passwordUsuario) {
      this.mensajeError = 'Por favor ingresa una contraseña';
      return;
    }

    // Validar longitud de contraseña
    if (!this.validarPassword(this.passwordUsuario)) {
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    // Enviar datos al backend
    this.cargando = true;

    this.http
      .post('http://localhost:3000/auth/register', {
        firstName: this.nombreUsuario,
        lastName: 'Registro',
        email: this.emailUsuario,
        password: this.passwordUsuario,
        belt: 'BLANCO',
        beltDegree: 0,
        memberType: 'ALUMNO',
        status: 'ACTIVO',
      })
      .subscribe({
        next: (response: any) => {
          console.log('Cuenta creada exitosamente', response);
          alert('¡Cuenta creada! Ahora inicia sesión');
          this.router.navigate(['/login']);
          this.cargando = false;
        },
        error: (error: any) => {
          console.error('Error al registrar:', error);
          this.mensajeError =
            error.error?.message || 'Error al crear la cuenta. Intenta de nuevo.';
          this.cargando = false;
        },
      });
  }
}
