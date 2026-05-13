import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './user-footer.component.html',
  styleUrls: ['./user-footer.component.css'],
})
export class FooterComponent {}
