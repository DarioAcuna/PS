import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';

@Injectable()
export class ClasesService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizarCampo(value?: string) {
    const clean = value?.trim();
    return clean?.length ? clean : undefined;
  }

  private async validarCombinacionUnica(
    name: string,
    level: string,
    currentClassId?: number,
  ) {
    const existente = await this.prisma.clase.findFirst({
      where: {
        name,
        level,
        ...(currentClassId ? { NOT: { id: currentClassId } } : {}),
      },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe una clase con el mismo nombre y nivel',
      );
    }
  }

  async create(createClaseDto: CreateClaseDto) {
    const name = this.normalizarCampo(createClaseDto.name);
    const level = this.normalizarCampo(createClaseDto.level);

    if (!name) {
      throw new ConflictException('El nombre de la clase es obligatorio');
    }

    if (!level) {
      throw new ConflictException('El nivel de la clase es obligatorio');
    }

    await this.validarCombinacionUnica(name, level);

    try {
      return this.prisma.clase.create({
        data: {
          name,
          level,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una clase con el mismo nombre y nivel',
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.clase.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const clase = await this.prisma.clase.findUnique({
      where: { id },
    });

    if (!clase) {
      throw new NotFoundException('Clase no encontrada');
    }

    return clase;
  }

  async update(id: number, updateClaseDto: UpdateClaseDto) {
    const actual = await this.findOne(id);

    const name = this.normalizarCampo(updateClaseDto.name) ?? actual.name;
    const level = this.normalizarCampo(updateClaseDto.level) ?? actual.level ?? '';

    if (!level) {
      throw new ConflictException('El nivel de la clase es obligatorio');
    }

    await this.validarCombinacionUnica(name, level, id);

    try {
      return this.prisma.clase.update({
        where: { id },
        data: {
          name,
          level,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una clase con el mismo nombre y nivel',
        );
      }

      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      const horarios = await tx.schedule.findMany({
        where: { classId: id },
        select: { id: true },
      });

      const scheduleIds = horarios.map((horario) => horario.id);

      if (scheduleIds.length > 0) {
        const sesiones = await tx.session.findMany({
          where: {
            scheduleId: {
              in: scheduleIds,
            },
          },
          select: { id: true },
        });

        const sessionIds = sesiones.map((sesion) => sesion.id);

        if (sessionIds.length > 0) {
          await tx.reservation.deleteMany({
            where: {
              sessionId: {
                in: sessionIds,
              },
            },
          });
        }

        await tx.session.deleteMany({
          where: {
            scheduleId: {
              in: scheduleIds,
            },
          },
        });

        await tx.schedule.deleteMany({
          where: {
            id: {
              in: scheduleIds,
            },
          },
        });
      }

      return tx.clase.delete({
        where: { id },
      });
    });
  }
}
