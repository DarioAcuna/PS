import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';

interface Member {
  id: number;
  name: string;
  email: string;
  belt: string;
  beltGrade: string;
  quotaType: string;
  totalClasses: number;
  status: string;
  joinDate: string;
}

@Component({
  selector: 'app-admin-members',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class AdminMembers implements OnInit {
  readonly authService = inject(AuthService);
  readonly http = inject(HttpClient);

  currentUser$ = this.authService.currentUser$;
  members: Member[] = [];
  filteredMembers: Member[] = [];
  belts: string[] = ['Blanco', 'Azul', 'Púrpura', 'Marrón', 'Negro'];
  quotaTypes: string[] = ['Mensual', 'Trimestral', 'Anual'];
  statuses: string[] = ['Activo', 'Inactivo'];

  selectedBelt = '';
  selectedQuotaType = '';
  selectedStatus = '';
  searchTerm = '';
  loading = true;
  errorMessage = '';

  showNewMemberModal = false;
  showEditMemberModal = false;
  editingMember: Member | null = null;

  newMember: Partial<Member> = {};

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<{ users: any[] }>('assets/data/users.json').subscribe({
      next: (data) => {
        // Filtrar solo usuarios con rol 'user'
        this.members = data.users
          .filter(user => user.role === 'user')
          .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            belt: user.belt || 'Blanco',
            beltGrade: user.beltGrade || '0',
            quotaType: user.quotaType || 'Mensual',
            totalClasses: user.totalClasses || 0,
            status: user.status || 'Activo',
            joinDate: user.joinDate || new Date().toISOString().split('T')[0]
          }));

        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar los miembros:', error);
        this.errorMessage = 'No se pudo cargar el archivo users.json.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.filteredMembers = this.members.filter((member) => {
      const matchesSearch =
        !this.searchTerm ||
        this.normalizeText(member.name).includes(this.normalizeText(this.searchTerm)) ||
        this.normalizeText(member.email).includes(this.normalizeText(this.searchTerm));

      const matchesBelt = !this.selectedBelt || member.belt === this.selectedBelt;
      const matchesQuotaType = !this.selectedQuotaType || member.quotaType === this.selectedQuotaType;
      const matchesStatus = !this.selectedStatus || member.status === this.selectedStatus;

      return matchesSearch && matchesBelt && matchesQuotaType && matchesStatus;
    });
  }

  normalizeText(text: string): string {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  trackByMemberId(index: number, member: Member): number {
    return member.id;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedBelt = '';
    this.selectedQuotaType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  openNewMemberModal(): void {
    this.newMember = {};
    this.showNewMemberModal = true;
  }

  closeNewMemberModal(): void {
    this.showNewMemberModal = false;
    this.newMember = {};
  }

  openEditMemberModal(member: Member): void {
    this.editingMember = { ...member };
    this.showEditMemberModal = true;
  }

  closeEditMemberModal(): void {
    this.showEditMemberModal = false;
    this.editingMember = null;
  }

  saveMember(): void {
    if (this.newMember.name && this.newMember.email) {
      const member: Member = {
        id: Math.max(...this.members.map(m => m.id), 0) + 1,
        name: this.newMember.name,
        email: this.newMember.email,
        belt: this.newMember.belt || 'Blanco',
        beltGrade: this.newMember.beltGrade || '0',
        quotaType: this.newMember.quotaType || 'Mensual',
        totalClasses: this.newMember.totalClasses || 0,
        status: this.newMember.status || 'Activo',
        joinDate: this.newMember.joinDate || new Date().toISOString().split('T')[0]
      };

      this.members.push(member);
      this.applyFilters();
      this.closeNewMemberModal();
      this.saveMembersToLocalStorage();
    }
  }

  saveEdit(): void {
    if (this.editingMember) {
      const index = this.members.findIndex(m => m.id === this.editingMember!.id);
      if (index !== -1) {
        this.members[index] = this.editingMember;
        this.applyFilters();
        this.closeEditMemberModal();
        this.saveMembersToLocalStorage();
      }
    }
  }

  deleteMember(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este miembro?')) {
      this.members = this.members.filter(m => m.id !== id);
      this.applyFilters();
      this.saveMembersToLocalStorage();
    }
  }

  saveMembersToLocalStorage(): void {
    // En una aplicación real, enviarías esto a un servidor
    localStorage.setItem('members', JSON.stringify(this.members));
  }

  logout(): void {
    this.authService.logout();
  }
}

