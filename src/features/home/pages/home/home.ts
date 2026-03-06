import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  readonly authService = inject(AuthService);

  currentUser$ = this.authService.currentUser$;

  logout(): void {
    this.authService.logout();
  }
}
