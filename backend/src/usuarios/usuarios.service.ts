import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeText(value: string): string {
    return value.trim();
  }

  private buildFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  private toUserRole(memberType: CreateUsuarioDto['memberType']): UserRole {
    return memberType === 'PROFESOR' ? UserRole.PROFESOR : UserRole.ALUMNO;
  }

  private toUserStatus(status: CreateUsuarioDto['status']): UserStatus {
    return status === 'INACTIVO' ? UserStatus.INACTIVO : UserStatus.ACTIVO;
  }

  private async assertUniqueEmail(email: string, currentId?: number) {
    const existente = await this.prisma.user.findFirst({
      where: {
        email,
        ...(currentId ? { NOT: { id: currentId } } : {}),
      },
    });

    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }
  }

  async create(dto: CreateUsuarioDto) {
    const firstName = this.normalizeText(dto.firstName);
    const lastName = this.normalizeText(dto.lastName);
    const email = dto.email.trim().toLowerCase();
    const belt = this.normalizeText(dto.belt);
    const role = this.toUserRole(dto.memberType);
    const status = this.toUserStatus(dto.status);

    await this.assertUniqueEmail(email);

    try {
      return await this.prisma.user.create({
        data: {
          name: this.buildFullName(firstName, lastName),
          firstName,
          lastName,
          email,
          password: null,
          role,
          belt,
          beltDegree: dto.beltDegree,
          status,
        },
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
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
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
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.user.findUnique({
      where: { id },
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
        createdAt: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const actual = await this.findOne(id);

    const email = dto.email?.trim().toLowerCase() ?? actual.email;
    await this.assertUniqueEmail(email, id);

    const firstName =
      dto.firstName !== undefined
        ? this.normalizeText(dto.firstName)
        : (actual.firstName ?? actual.name);
    const lastName =
      dto.lastName !== undefined
        ? this.normalizeText(dto.lastName)
        : (actual.lastName ?? '');

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined ? { firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName } : {}),
          ...(dto.firstName !== undefined || dto.lastName !== undefined
            ? { name: this.buildFullName(firstName, lastName) }
            : {}),
          ...(dto.email !== undefined ? { email } : {}),
          ...(dto.belt !== undefined
            ? { belt: this.normalizeText(dto.belt) }
            : {}),
          ...(dto.beltDegree !== undefined
            ? { beltDegree: dto.beltDegree }
            : {}),
          ...(dto.memberType !== undefined
            ? { role: this.toUserRole(dto.memberType) }
            : {}),
          ...(dto.status !== undefined
            ? { status: this.toUserStatus(dto.status) }
            : {}),
        },
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
          createdAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un usuario con ese correo');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
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
        createdAt: true,
      },
    });
  }
}
