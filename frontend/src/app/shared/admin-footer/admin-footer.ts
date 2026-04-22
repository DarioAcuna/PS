import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-footer',
  templateUrl: './admin-footer.html',
  styleUrls: ['./admin-footer.css'],
})
export class AdminFooterComponent {
  activeTab: 'perfil' | 'reservas' | 'panel' = 'panel';

  constructor(private router: Router) {}

  setActiveTab(tab: 'perfil' | 'reservas' | 'panel'): void {
    this.activeTab = tab;

    if (tab === 'perfil') {
      this.router.navigate(['/admin/perfil']);
    } else if (tab === 'reservas') {
      this.router.navigate(['/admin/reservas']);
    } else if (tab === 'panel') {
      this.router.navigate(['/admin/panel']);
    }
  }
}
