import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FooterComponent } from '../../shared/admin-footer/admin-footer';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePageComponent {}
