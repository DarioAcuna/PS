import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { User, LoginResponse, RegisterRequest } from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${API_BASE_URL}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación cargando datos de localStorage si existen
   */
  private initializeAuth(): void {
    // Limpiar datos inválidos o antiguos de localStorage
    // SOLO cargar si realmente hay una sesión activa
    const userJson = localStorage.getItem('current_user');

    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        // Validar que el usuario tiene propiedades requeridas
        if (user && user.id && user.email) {
          this.currentUserSubject.next(user);
        } else {
          // Datos inválidos, limpiar
          localStorage.removeItem('current_user');
        }
      } catch (error) {
        // JSON inválido, limpiar
        console.warn('Invalid user data in localStorage, clearing');
        localStorage.removeItem('current_user');
      }
    }
  }

  /**
   * Inicia sesión con email y contraseña
   * El token se guarda automáticamente en httpOnly cookie
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`,
      { email, password },
      { withCredentials: true }
    )
      .pipe(
        tap(response => {
          this.setCurrentUser(response.user);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  /**
   * Registra un nuevo usuario
   */
  register(registerData: RegisterRequest): Observable<User> {
    return this.http.post<User>(
      `${this.API_URL}/register`,
      registerData,
      { withCredentials: true }
    );
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/logout`,
      {},
      { withCredentials: true }
    )
      .pipe(
        tap(() => {
          localStorage.removeItem('current_user');
          this.currentUserSubject.next(null);
        })
      );
  }

  /**
   * Retorna true si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const hasUser = !!this.currentUserSubject.value;
    console.log('isAuthenticated:', hasUser, 'user:', this.currentUserSubject.value);
    return hasUser;
  }

  /**
   * Obtiene el usuario current
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el usuario actual como observable
   */
  getCurrentUser$(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Obtiene todos los usuarios (requiere token en cookie)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.API_URL}/users`,
      { withCredentials: true }
    );
  }

  /**
   * Obtiene un usuario por ID (requiere token en cookie)
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(
      `${this.API_URL}/users/${id}`,
      { withCredentials: true }
    );
  }

  /**
   * Elimina un usuario por ID (requiere token en cookie)
   */
  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.API_URL}/users/${id}`,
      { withCredentials: true }
    );
  }

  /**
   * Guarda el usuario actual en localStorage
   * (Se guarda SOLO el usuario, NO el token)
   */
  private setCurrentUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  /**
   * Limpia todos los datos de autenticación (para testing/desarrollo)
   */
  clearAll(): void {
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }
}
