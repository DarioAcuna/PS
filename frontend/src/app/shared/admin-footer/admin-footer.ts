import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-footer.html',
  styleUrl: './admin-footer.css',
})
export class FooterComponent {}
