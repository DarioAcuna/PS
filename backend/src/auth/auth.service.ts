import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UsuarioEstado, UsuarioTipo } from '../usuarios/dto/usuario.enums';
import { PAYMENT_PLANS } from '../pagos/payment-plans';
import type { PaymentPlanId } from '../pagos/payment-plans';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Mensaje genérico para prevenir User Enumeration
    // No revela si el usuario existe o si la contraseña es incorrecta
    const genericErrorMessage = 'Email o contraseña incorrectos';

    // Si el usuario no existe o no tiene contraseña, usamos la misma excepción
    if (!user || !user.password) {
      // Agregar delay artificial para evitar timing attacks
      await this.delayForSecurityReasons();
      throw new UnauthorizedException(genericErrorMessage);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Agregar delay artificial para evitar timing attacks
      await this.delayForSecurityReasons();
      throw new UnauthorizedException(genericErrorMessage);
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Agrega un delay aleatorio para prevenir timing attacks
   * Los atacantes no pueden medir el tiempo de respuesta para saber
   * si el usuario existe o no
   */
  private async delayForSecurityReasons(): Promise<void> {
    // Delay aleatorio entre 100ms y 300ms
    const randomDelay = Math.floor(Math.random() * 200) + 100;
    await new Promise((resolve) => setTimeout(resolve, randomDelay));
  }

  async register(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const fullName = `${firstName} ${lastName}`.trim();

    const role =
      dto.memberType === UsuarioTipo.PROFESOR
        ? UserRole.PROFESOR
        : UserRole.ALUMNO;

    const status =
      dto.status === UsuarioEstado.INACTIVO
        ? UserStatus.INACTIVO
        : UserStatus.ACTIVO;

    const user = await this.prisma.user.create({
      data: {
        name: fullName,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        belt: dto.belt.trim(),
        beltDegree: dto.beltDegree,
        status,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async getProfile(userId: number) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        belt: true,
        beltDegree: true,
        status: true,
        membershipPlan: true,
        membershipStartedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const plan = user.membershipPlan
      ? PAYMENT_PLANS[user.membershipPlan as PaymentPlanId]
      : undefined;
    const usedClasses = await this.prisma.reservation.count({
      where: {
        userId,
        session: {
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      },
    });

    return {
      ...user,
      membership: {
        planId: plan?.id ?? null,
        planName: plan?.name ?? 'Sin cuota',
        monthlyClassLimit: plan?.monthlyClassLimit ?? 0,
        usedClasses,
      },
    };
  }
}
