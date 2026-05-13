import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { FooterComponent as AdminFooterComponent } from '../admin-footer/admin-footer';
import { FooterComponent as UserFooterComponent } from '../user-footer/user-footer.component';

@Component({
  selector: 'app-role-footer',
  standalone: true,
  imports: [CommonModule, AdminFooterComponent, UserFooterComponent],
  templateUrl: './role-footer.html',
})
export class RoleFooterComponent {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly showAdminFooter$ = combineLatest([
    this.authService.getCurrentUser$(),
    this.route.queryParamMap,
  ]).pipe(
    map(([user, params]) => {
      const viewingAsUser = params.get('vista') === 'usuario';

      return this.authService.isAdminUser(user) && !viewingAsUser;
    }),
  );
}
