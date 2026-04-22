import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminFooterComponent } from '../../shared/admin-footer/admin-footer';

@Component({
  standalone: true,
  imports: [CommonModule, AdminFooterComponent],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss'],
})
export class HomePage {}
