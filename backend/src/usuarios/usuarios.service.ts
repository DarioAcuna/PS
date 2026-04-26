import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioEstado, UsuarioTipo } from './dto/usuario.enums';

type UsuarioRecord = {
  id: number;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  password?: string | null;
  role: UserRole;
  belt?: string | null;
  beltDegree?: number | null;
  status?: UsuarioEstado | string;
  createdAt: Date;
};

type UserModelDelegate = {
  findFirst(args: unknown): Promise<UsuarioRecord | null>;
  create(args: unknown): Promise<UsuarioRecord>;
  findMany(args: unknown): Promise<UsuarioRecord[]>;
  findUnique(args: unknown): Promise<UsuarioRecord | null>;
  update(args: unknown): Promise<UsuarioRecord>;
  delete(args: unknown): Promise<UsuarioRecord>;
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  private get userModel(): UserModelDelegate {
    return (this.prisma as unknown as { user: UserModelDelegate }).user;
  }

  private readonly protectedAdminEmail = (
    process.env.PROTECTED_ADMIN_EMAIL ?? 'admin@example.com'
  )
    .trim()
    .toLowerCase();

  private normalizeText(value: string): string {
    return value.trim();
  }

  private buildFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  private toUserRole(memberType: CreateUsuarioDto['memberType']): UserRole {
    return memberType === UsuarioTipo.PROFESOR
      ? UserRole.PROFESOR
      : UserRole.ALUMNO;
  }

  private toUserStatus(status: CreateUsuarioDto['status']): UsuarioEstado {
    return status === UsuarioEstado.INACTIVO
      ? UsuarioEstado.INACTIVO
      : UsuarioEstado.ACTIVO;
  }

  private isProtectedAdmin(email: string): boolean {
    return email.trim().toLowerCase() === this.protectedAdminEmail;
  }

  private assertProtectedAdminRules(
    actual: {
      email: string;
      role: UserRole;
    },
    dto: UpdateUsuarioDto,
    nextEmail: string,
  ): void {
    if (
      !this.isProtectedAdmin(actual.email) ||
      actual.role !== UserRole.ADMIN
    ) {
      return;
    }

    if (nextEmail !== actual.email) {
      throw new ConflictException(
        'No se puede cambiar el email del admin protegido',
      );
    }

    if (dto.memberType !== undefined) {
      throw new ConflictException(
        'No se puede cambiar el rol del admin protegido',
      );
    }

    if (
      dto.status !== undefined &&
      this.toUserStatus(dto.status) !== UsuarioEstado.ACTIVO
    ) {
      throw new ConflictException('No se puede desactivar el admin protegido');
    }
  }

  private async assertUniqueEmail(email: string, currentId?: number) {
    const existente = await this.userModel.findFirst({
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
      return await this.userModel.create({
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
    return this.userModel.findMany({
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
    const usuario = await this.userModel.findUnique({
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
    this.assertProtectedAdminRules(actual, dto, email);
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
      return await this.userModel.update({
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
    const actual = await this.findOne(id);

    if (this.isProtectedAdmin(actual.email) && actual.role === UserRole.ADMIN) {
      throw new ConflictException('No se puede eliminar el admin protegido');
    }

    return this.userModel.delete({
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
