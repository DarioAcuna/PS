import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly authService = inject(AuthService);

  currentUser$ = this.authService.currentUser$;
  isAdmin$ = this.currentUser$.pipe(
    map(user => {
      const role = user?.role?.toLowerCase();
      return role === 'admin' || role === 'administrador';
    })
  );

  logout(): void {
    this.authService.logout();
  }
}
