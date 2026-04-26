import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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

  onSelectTab(tabId: string): void {
    this.tabSelected.emit(tabId);
  }

  onGoHome(): void {
    this.homeClicked.emit();
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }
}
