import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

interface HeaderNavItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.css',
})
export class AdminHeaderComponent {
  @Input() selectedTab = '';
  @Input() navItems: HeaderNavItem[] = [];

  @Output() tabSelected = new EventEmitter<string>();
  @Output() homeClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get canPreviewAsUser(): boolean {
    return this.authService.isAdmin();
  }

  get isPreviewingAsUser(): boolean {
    return this.route.snapshot.queryParamMap.get('vista') === 'usuario';
  }

  onSelectTab(tabId: string): void {
    this.tabSelected.emit(tabId);
  }

  onGoHome(): void {
    this.homeClicked.emit();
  }

  showUserPreview(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vista: 'usuario' },
      queryParamsHandling: 'merge',
    });
  }

  showAdminPreview(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vista: null },
      queryParamsHandling: 'merge',
    });
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }
}
