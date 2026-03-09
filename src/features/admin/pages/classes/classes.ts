import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-admin-classes',
  imports: [CommonModule, RouterModule],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class AdminClasses {
  readonly authService = inject(AuthService);
  currentUser$ = this.authService.currentUser$;

  logout(): void {
    this.authService.logout();
  }
}
