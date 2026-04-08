import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListarSesionesDto } from './dto/listar-sesiones.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { GenerarSesionesDto } from './dto/generar-sesiones.dto';

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

  private haySolapamiento(
    inicioA: string,
    finA: string,
    inicioB: string,
    finB: string,
  ) {
    return inicioA < finB && finA > inicioB;
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

    if (startTime >= endTime) {
      throw new ConflictException(
        'La hora de inicio debe ser menor que la de fin',
      );
    }

    const sesionesMismoDia = await this.prisma.session.findMany({
      where: {
        date: actual.date,
        NOT: { id },
        status: { not: SessionStatus.CANCELED },
      },
    });

    for (const sesion of sesionesMismoDia) {
      const solapa = this.haySolapamiento(
        startTime,
        endTime,
        sesion.startTime,
        sesion.endTime,
      );

      if (!solapa) continue;

      if (instructor && sesion.instructor && instructor === sesion.instructor) {
        throw new ConflictException(
          'El instructor ya está ocupado en esa franja horaria',
        );
      }
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        startTime,
        endTime,
        instructor,
        status: dto.status ?? SessionStatus.MODIFIED,
      },
    });
  }

  async cancelar(id: number) {
    const sesion = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada');
    }

    if (sesion.status === SessionStatus.CANCELED) {
      throw new ConflictException('La sesión ya está cancelada');
    }

    return this.prisma.session.update({
      where: { id },
      data: {
        status: SessionStatus.CANCELED,
      },
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
      status: SessionStatus;
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
          status: SessionStatus.SCHEDULED,
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
