import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
}

interface UsersResponse {
  users: User[];
}

// Datos de usuarios hardcodeados
const USERS_DATA: UsersResponse = {
  users: [
    {
      id: 1,
      name: "Administrador",
      email: "admin@gym.com",
      password: "admin123",
      role: "admin"
    },
    {
      id: 2,
      name: "Juan Pérez",
      email: "juan@gym.com",
      password: "juan123",
      role: "user"
    }
  ]
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<User | null>(null);

  public isAuthenticated$: Observable<boolean> = this.isAuthenticated.asObservable();
  public currentUser$: Observable<User | null> = this.currentUser.asObservable();

  constructor(private router: Router) {
    this.checkAuthStatus();
  }

  login(email: string, password: string): Observable<User | null> {
    return of(USERS_DATA).pipe(
      delay(500),
      map(response => {
        const user = response.users.find(u => u.email === email && u.password === password);

        if (user) {
          // Guardar en localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.isAuthenticated.next(true);
          this.currentUser.next(user);
          return user;
        }

        return null;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.isAuthenticated.next(false);
    this.currentUser.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated.value;
  }

  private checkAuthStatus(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.isAuthenticated.next(true);
        this.currentUser.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }
}

