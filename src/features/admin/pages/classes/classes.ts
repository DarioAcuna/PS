import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/services/auth.service';

interface Class {
  id: number;
  name: string;
  discipline: string;
  level: string;
  instructor: string;
  schedule: string;
  time: string;
  capacity: number;
  enrolled: number;
  status: string;
}

@Component({
  selector: 'app-admin-classes',
  imports: [CommonModule, RouterModule],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class AdminClasses implements OnInit {
  readonly authService = inject(AuthService);
  readonly http = inject(HttpClient);

  currentUser$ = this.authService.currentUser$;
  classes: Class[] = [];
  filteredClasses: Class[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.http.get<Class[]>('/assets/data/classes.json').subscribe({
      next: (data) => {
        this.classes = data;
        this.filteredClasses = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las clases:', error);
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
