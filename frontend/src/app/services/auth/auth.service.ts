import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { User, LoginResponse, RegisterRequest } from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${API_BASE_URL}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Inicia sesión con email y contraseña
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setToken(response.access_token);
          this.setCurrentUser(response.user);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  /**
   * Registra un nuevo usuario
   */
  register(registerData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, registerData);
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  /**
   * Guarda el token en localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  /**
   * Obtiene el token del localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Guarda el usuario actual en localStorage
   */
  private setCurrentUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  /**
   * Retorna true si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtiene el usuario actual
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
   * Obtiene todos los usuarios (requiere token)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/users`);
  }

  /**
   * Obtiene un usuario por ID (requiere token)
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Elimina un usuario por ID (requiere token)
   */
  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Recupera el usuario del localStorage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
  }
}

