import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorariosService {
  constructor(private readonly prisma: PrismaService) {}

  private haySolapamiento(
    inicioA: string,
    finA: string,
    inicioB: string,
    finB: string,
  ) {
    return inicioA < finB && finA > inicioB;
  }

  private async validarClaseExiste(classId: number) {
    const clase = await this.prisma.clase.findUnique({
      where: { id: classId },
    });

    if (!clase) {
      throw new NotFoundException('La clase indicada no existe');
    }
  }

  private async validarSolapamientos(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    currentScheduleId?: number,
  ) {
    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        ...(currentScheduleId ? { NOT: { id: currentScheduleId } } : {}),
      },
    });

    for (const schedule of schedules) {
      const solapa = this.haySolapamiento(
        startTime,
        endTime,
        schedule.startTime,
        schedule.endTime,
      );

      if (!solapa) continue;

      throw new ConflictException('Ya existe un horario en esa franja horaria');
    }
  }

  async create(dto: CreateHorarioDto) {
    if (dto.startTime >= dto.endTime) {
      throw new ConflictException(
        'La hora de inicio debe ser menor que la de fin',
      );
    }

    await this.validarClaseExiste(dto.classId);

    await this.validarSolapamientos(
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

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

    await this.validarSolapamientos(
      dayOfWeek,
      startTime,
      endTime,
      id,
    );

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
