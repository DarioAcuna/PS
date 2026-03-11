import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../auth/services/auth.service';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  classes: string[];
  experience: string;
  status: string;
}

@Component({
  selector: 'app-admin-teachers',
  imports: [CommonModule, RouterModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.css',
})
export class AdminTeachers implements OnInit {
  readonly authService = inject(AuthService);
  readonly http = inject(HttpClient);

  currentUser$ = this.authService.currentUser$;
  teachers: Teacher[] = [];
  filteredTeachers: Teacher[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    // Simulando datos de profesores
    const mockTeachers: Teacher[] = [
      {
        id: 1,
        name: 'Carlos Perez',
        email: 'carlos@gym.com',
        phone: '+34 612 345 678',
        classes: ['JiuJitsu', 'JiuJitsu Fundamentos', 'JiuJitsu TLN'],
        experience: '15 años',
        status: 'Activo'
      },
      {
        id: 2,
        name: 'Juan Garcia',
        email: 'juan@gym.com',
        phone: '+34 623 456 789',
        classes: ['Nogi', 'Nogi Fundamentos', 'Sparring'],
        experience: '10 años',
        status: 'Activo'
      },
      {
        id: 3,
        name: 'Maria Lopez',
        email: 'maria@gym.com',
        phone: '+34 634 567 890',
        classes: ['JiuJitsu Proclass', 'Nogi Proclass'],
        experience: '8 años',
        status: 'Activo'
      },
      {
        id: 4,
        name: 'Diego Martinez',
        email: 'diego@gym.com',
        phone: '+34 645 678 901',
        classes: ['Infantiles', 'Juveniles'],
        experience: '5 años',
        status: 'Inactivo'
      },
      {
        id: 5,
        name: 'Ana Hernandez',
        email: 'ana@gym.com',
        phone: '+34 656 789 012',
        classes: ['Nogi TLN', 'Sparring', 'JiuJitsu'],
        experience: '7 años',
        status: 'Activo'
      }
    ];

    this.teachers = mockTeachers;
    this.filteredTeachers = mockTeachers;
    this.loading = false;
  }

  logout(): void {
    this.authService.logout();
  }
}

