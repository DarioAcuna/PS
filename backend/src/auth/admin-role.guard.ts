import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role;

    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo administradores');
    }

    return true;
  }
}
