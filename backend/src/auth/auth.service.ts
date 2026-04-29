import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

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
    await new Promise(resolve => setTimeout(resolve, randomDelay));
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const cleanName = name.trim();

    const user = await this.prisma.user.create({
      data: {
        name: cleanName,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
