import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, finalize } from 'rxjs';
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
   * Inicia sesión with email y contraseña
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
          if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
          }
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

  getProfile(): Observable<User> {
    return this.http.get<User>(
      `${this.API_URL}/me`,
      { withCredentials: true }
    )
      .pipe(
        tap(user => {
          this.setCurrentUser(user);
          this.currentUserSubject.next(user);
        })
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
        finalize(() => {
          localStorage.removeItem('current_user');
          localStorage.removeItem('access_token');
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

  isAdmin(): boolean {
    return this.isAdminUser(this.currentUserSubject.value);
  }

  isAdminUser(user: User | null): boolean {
    return user?.role?.toUpperCase() === 'ADMIN';
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
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
  }
}
