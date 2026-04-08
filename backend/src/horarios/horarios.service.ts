import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarClaseExiste(classId: number) {
    const clase = await this.prisma.clase.findUnique({
      where: { id: classId },
    });

    if (!clase) {
      throw new NotFoundException('La clase indicada no existe');
    }
  }

  private async validarLimiteFranja(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentScheduleId?: number,
  ) {
    const schedulesInSlot = await this.prisma.schedule.count({
      where: {
        dayOfWeek,
        startTime,
        endTime,
        ...(currentScheduleId ? { NOT: { id: currentScheduleId } } : {}),
      },
    });

    if (schedulesInSlot >= 2) {
      throw new ConflictException(
        'Solo puede haber 2 clases por la misma franja horaria',
      );
    }
  }

  async create(dto: CreateHorarioDto) {
    if (dto.startTime >= dto.endTime) {
      throw new ConflictException(
        'La hora de inicio debe ser menor que la de fin',
      );
    }

    await this.validarClaseExiste(dto.classId);

    await this.validarLimiteFranja(
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

    try {
      return this.prisma.schedule.create({
        data: {
          classId: dto.classId,
          dayOfWeek: dto.dayOfWeek,
          startTime: dto.startTime,
          endTime: dto.endTime,
          maxCapacity: dto.maxCapacity,
        },
        include: {
          class: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException(
          'Solo puede haber 2 clases por la misma franja horaria',
        );
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.schedule.findMany({
      include: { class: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: number) {
    const horario = await this.prisma.schedule.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }

    return horario;
  }

  async update(id: number, dto: UpdateHorarioDto) {
    const actual = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!actual) {
      throw new NotFoundException('Horario no encontrado');
    }

    const classId = dto.classId ?? actual.classId;
    const dayOfWeek = dto.dayOfWeek ?? actual.dayOfWeek;
    const startTime = dto.startTime ?? actual.startTime;
    const endTime = dto.endTime ?? actual.endTime;
    const maxCapacity = dto.maxCapacity ?? actual.maxCapacity;

    if (startTime >= endTime) {
      throw new ConflictException(
        'La hora de inicio debe ser menor que la de fin',
      );
    }

    await this.validarClaseExiste(classId);

    await this.validarLimiteFranja(
      dayOfWeek,
      startTime,
      endTime,
      id,
    );

    try {
      return this.prisma.schedule.update({
        where: { id },
        data: {
          classId,
          dayOfWeek,
          startTime,
          endTime,
          maxCapacity,
        },
        include: { class: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException(
          'Solo puede haber 2 clases por la misma franja horaria',
        );
      }

      throw error;
    }
  }

  async remove(id: number) {
    const horario = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!horario) {
      throw new NotFoundException('Horario no encontrado');
    }

    const sesionesAsociadas = await this.prisma.session.count({
      where: { scheduleId: id },
    });

    if (sesionesAsociadas > 0) {
      throw new ConflictException(
        'No se puede borrar el horario porque tiene sesiones asociadas',
      );
    }

    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}
