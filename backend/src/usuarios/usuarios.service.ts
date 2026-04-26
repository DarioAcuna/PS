import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

type UsuarioRecord = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  belt: string;
  beltDegree: number;
  memberType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type MemberModelDelegate = {
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

  private get memberModel(): MemberModelDelegate {
    return (this.prisma as unknown as { member: MemberModelDelegate }).member;
  }

  private normalizeText(value: string): string {
    return value.trim();
  }

  private async assertUniqueEmail(email: string, currentId?: number) {
    const existente = await this.memberModel.findFirst({
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

    await this.assertUniqueEmail(email);

    try {
      return await this.memberModel.create({
        data: {
          firstName,
          lastName,
          email,
          belt,
          beltDegree: dto.beltDegree,
          memberType: dto.memberType,
          status: dto.status,
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
    return this.memberModel.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.memberModel.findUnique({
      where: { id },
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

    try {
      return await this.memberModel.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined
            ? { firstName: this.normalizeText(dto.firstName) }
            : {}),
          ...(dto.lastName !== undefined
            ? { lastName: this.normalizeText(dto.lastName) }
            : {}),
          ...(dto.email !== undefined ? { email } : {}),
          ...(dto.belt !== undefined
            ? { belt: this.normalizeText(dto.belt) }
            : {}),
          ...(dto.beltDegree !== undefined
            ? { beltDegree: dto.beltDegree }
            : {}),
          ...(dto.memberType !== undefined
            ? { memberType: dto.memberType }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
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

    return this.memberModel.delete({
      where: { id },
    });
  }
}
