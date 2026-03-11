import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class AdminClasses implements OnInit {
  readonly authService = inject(AuthService);
  readonly http = inject(HttpClient);

  currentUser$ = this.authService.currentUser$;
  classes: Class[] = [];
  filteredClasses: Class[] = [];
  disciplines: string[] = [];
  levels: string[] = [];
  instructors: string[] = [];
  days: string[] = [];
  selectedDiscipline = '';
  selectedLevel = '';
  selectedInstructor = '';
  selectedDay = '';
  searchTerm = '';
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<Class[]>('assets/data/classes.json').subscribe({
      next: (data) => {
        this.classes = data;
        this.disciplines = this.getUniqueValues(data, 'discipline');
        this.levels = this.getUniqueValues(data, 'level');
        this.instructors = this.getUniqueValues(data, 'instructor');
        this.days = this.getUniqueDays(data);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar las clases:', error);
        this.errorMessage = 'No se pudo cargar el archivo classes.json.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.filteredClasses = this.classes.filter((item) => {
      const matchesSearch =
        !this.searchTerm ||
        this.normalizeText(item.name).includes(this.normalizeText(this.searchTerm)) ||
        this.normalizeText(item.discipline).includes(this.normalizeText(this.searchTerm)) ||
        this.normalizeText(item.instructor).includes(this.normalizeText(this.searchTerm));

      const matchesDiscipline =
        !this.selectedDiscipline || item.discipline === this.selectedDiscipline;
      const matchesLevel = !this.selectedLevel || item.level === this.selectedLevel;
      const matchesInstructor =
        !this.selectedInstructor || item.instructor === this.selectedInstructor;
      const matchesDay =
        !this.selectedDay ||
        item.schedule
          .split(',')
          .map((day) => this.normalizeText(day))
          .includes(this.normalizeText(this.selectedDay));

      return (
        matchesSearch &&
        matchesDiscipline &&
        matchesLevel &&
        matchesInstructor &&
        matchesDay
      );
    });
  }

  resetFilters(): void {
    this.selectedDiscipline = '';
    this.selectedLevel = '';
    this.selectedInstructor = '';
    this.selectedDay = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  occupancyLabel(item: Class): string {
    return `${item.enrolled}/${item.capacity}`;
  }

  trackByClassId(_: number, item: Class): number {
    return item.id;
  }

  logout(): void {
    this.authService.logout();
  }

  private getUniqueValues(data: Class[], key: keyof Class): string[] {
    return [...new Set(data.map((item) => String(item[key]).trim()))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }

  private getUniqueDays(data: Class[]): string[] {
    return [
      ...new Set(
        data.flatMap((item) =>
          item.schedule
            .split(',')
            .map((day) => day.trim())
            .filter(Boolean)
        )
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
