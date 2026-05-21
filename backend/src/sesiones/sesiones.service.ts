import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListarSesionesDto } from './dto/listar-sesiones.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { GenerarSesionesDto } from './dto/generar-sesiones.dto';
import { CreateSesionDto } from './dto/create.sesion.dto';

@Injectable()
export class SesionesService {
  constructor(private readonly prisma: PrismaService) {}

  private inicioFinDia(date: string) {
    const inicio = new Date(`${date}T00:00:00.000Z`);
    const fin = new Date(`${date}T23:59:59.999Z`);
    return { inicio, fin };
  }

  private inicioFinMes(year: number, month: number) {
    const inicio = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const fin = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { inicio, fin };
  }

  async create(dto: CreateSesionDto) {
    const horario = await this.prisma.schedule.findUnique({
      where: { id: dto.scheduleId },
      include: { class: true },
    });

    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }

    if (dto.startTime >= dto.endTime) {
      throw new ConflictException(
        'La hora de inicio debe ser menor que la de fin',
      );
    }

    const sessionDate = new Date(`${dto.date}T00:00:00.000Z`);

    if (typeof dto.instructorId === 'number') {
      const conflictoInstructor = await this.prisma.session.findFirst({
        where: {
          date: sessionDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
          instructorId: dto.instructorId,
        },
      });

      if (conflictoInstructor) {
        throw new ConflictException(
          'El instructor ya está asignado a esa franja en ese día',
        );
      }
    } else if (dto.instructor) {
      const conflictoInstructor = await this.prisma.session.findFirst({
        where: {
          date: sessionDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
          instructor: dto.instructor,
        },
      });

      if (conflictoInstructor) {
        throw new ConflictException(
          'El instructor ya está asignado a esa franja en ese día',
        );
      }
    }

    const sesionExistente = await this.prisma.session.findFirst({
      where: {
        scheduleId: dto.scheduleId,
        date: sessionDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });

    if (sesionExistente) {
      throw new ConflictException(
        'Ya existe una sesión para ese horario en esa fecha y franja',
      );
    }

    try {
      return await this.prisma.session.create({
        data: {
          scheduleId: dto.scheduleId,
          date: sessionDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
          instructor: dto.instructor || null,
          instructorId: typeof dto.instructorId === 'number' ? dto.instructorId : null,
          maxCapacity: Number(dto.maxCapacity ?? horario.maxCapacity),
          status: SessionStatus.SCHEDULED,
          className: horario.class.name,
          classLevel: horario.class.level ?? null,
        },
        include: {
          schedule: {
            include: {
              class: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe una sesión con esos datos');
      }

      throw error;
    }
  }

  async findAll(query: ListarSesionesDto) {
    const where = query.date
      ? (() => {
          const { inicio, fin } = this.inicioFinDia(query.date);
          return {
            date: {
              gte: inicio,
              lte: fin,
            },
          };
        })()
      : {};

    return this.prisma.session.findMany({
      where,
      include: {
        schedule: {
          include: {
            class: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: number) {
    const sesion = await this.prisma.session.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    return sesion;
  }

  async update(id: number, dto: UpdateSesionDto) {
    const actual = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!actual) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const startTime = dto.startTime ?? actual.startTime;
    const endTime = dto.endTime ?? actual.endTime;
    const instructor = dto.instructor ?? actual.instructor ?? undefined;
    const instructorId =
      typeof dto.instructorId === 'number'
        ? dto.instructorId
        : (actual as any).instructorId ?? undefined;

    if (startTime >= endTime) {
      throw new ConflictException(
        'La hora de inicio debe ser menor que la de fin',
      );
    }

    if (typeof instructorId === 'number') {
      const conflictoInstructor = await this.prisma.session.findFirst({
        where: {
          id: { not: id },
          date: actual.date,
          startTime,
          endTime,
          instructorId,
        },
      });

      if (conflictoInstructor) {
        throw new ConflictException(
          'El instructor ya está asignado a esa franja en ese día',
        );
      }
    } else if (instructor) {
      const conflictoInstructor = await this.prisma.session.findFirst({
        where: {
          id: { not: id },
          date: actual.date,
          startTime,
          endTime,
          instructor,
        },
      });

      if (conflictoInstructor) {
        throw new ConflictException(
          'El instructor ya está asignado a esa franja en ese día',
        );
      }
    }

    try {
      return this.prisma.session.update({
        where: { id },
        data: {
          className: dto.className ?? actual.className,
          classLevel: dto.classLevel ?? actual.classLevel,
          startTime,
          endTime,
          instructor,
          instructorId: typeof instructorId === 'number' ? instructorId : null,
          maxCapacity:
            typeof dto.maxCapacity === 'number'
              ? dto.maxCapacity
              : (actual as any).maxCapacity ?? null,
          status: dto.status ?? SessionStatus.MODIFIED,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'El instructor ya está asignado a esa franja en ese día',
        );
      }

      throw error;
    }
  }

  async remove(id: number) {
    const sesion = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    return this.prisma.session.delete({
      where: { id },
    });
  }

  async generar(dto: GenerarSesionesDto) {
    const horarios = await this.prisma.schedule.findMany({
      include: { class: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    if (horarios.length === 0) {
      throw new ConflictException(
        'No hay horarios base configurados para generar sesiones',
      );
    }

    const { inicio, fin } = this.inicioFinMes(dto.year, dto.month);

    const yaExisten = await this.prisma.session.count({
      where: {
        date: {
          gte: inicio,
          lte: fin,
        },
      },
    });

    if (yaExisten > 0) {
      throw new ConflictException(
        'Las sesiones de ese mes ya fueron generadas previamente',
      );
    }

    const data: {
      scheduleId: number;
      date: Date;
      startTime: string;
      endTime: string;
      maxCapacity: number;
      status: SessionStatus;
      className: string;
      classLevel: string | null;
    }[] = [];

    const ultimoDia = new Date(Date.UTC(dto.year, dto.month, 0)).getUTCDate();

    for (let day = 1; day <= ultimoDia; day++) {
      const sessionDate = new Date(Date.UTC(dto.year, dto.month - 1, day));
      const dayOfWeek = sessionDate.getUTCDay();

      for (const horario of horarios) {
        if (horario.dayOfWeek !== dayOfWeek) continue;

        data.push({
          scheduleId: horario.id,
          date: sessionDate,
          startTime: horario.startTime,
          endTime: horario.endTime,
          maxCapacity: horario.maxCapacity,
          status: SessionStatus.SCHEDULED,
          className: horario.class.name,
          classLevel: horario.class.level ?? null,
        });
      }
    }

    await this.prisma.session.createMany({
      data,
    });

    return {
      message: 'Sesiones generadas correctamente',
      total: data.length,
    };
  }
}
