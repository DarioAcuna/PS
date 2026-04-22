import { Component } from '@angular/core';

type FooterTab = 'reservas' | 'perfil' | 'pago';

@Component({
  selector: 'app-footer',
  templateUrl: './user-footer.component.html',
  styleUrls: ['./user-footer.component.css'],
})
export class FooterComponent {
  activeTab: FooterTab = 'reservas';

  setActiveTab(tab: FooterTab): void {
    this.activeTab = tab;

    // Si luego quieres navegar:
    // this.router.navigate(['/reservas']);
    // this.router.navigate(['/perfil']);
    // this.router.navigate(['/pago']);
  }
}
