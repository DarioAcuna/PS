import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PLANS } from '../pagos/payment-plans';
import type { PaymentPlanId } from '../pagos/payment-plans';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizarTexto(value?: string) {
    const clean = value?.trim();
    return clean?.length ? clean : undefined;
  }

  private normalizarHora(value?: string) {
    return value?.trim() || '00:00';
  }

  private validarRangoHorario(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'La hora de inicio debe ser menor que la hora final',
      );
    }
  }

  private buildEventDate(day: number, month: number, year: number) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const isValid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;

    if (!isValid) {
      throw new BadRequestException('Fecha del evento invalida');
    }

    return date;
  }

  private getEventStartAt(event: { eventDate: Date; startTime: string }): Date {
    const date = event.eventDate.toISOString().slice(0, 10);
    return new Date(`${date}T${event.startTime}:00`);
  }

  private getMembershipExpiration(startedAt: Date): Date {
    return new Date(
      startedAt.getFullYear(),
      startedAt.getMonth() + 1,
      startedAt.getDate(),
      startedAt.getHours(),
      startedAt.getMinutes(),
      startedAt.getSeconds(),
      startedAt.getMilliseconds(),
    );
  }

  private async assertUserCanReserveEvent(
    userId: number,
    event: { eventDate: Date; startTime: string },
  ) {
    if (this.getEventStartAt(event) <= new Date()) {
      throw new ConflictException(
        'No puedes reservar un evento que ya ha empezado o ya ha pasado',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { membershipPlan: true, membershipStartedAt: true },
    });
    const plan = user?.membershipPlan
      ? PAYMENT_PLANS[user.membershipPlan as PaymentPlanId]
      : undefined;

    if (!plan || !user?.membershipStartedAt) {
      throw new ConflictException('Necesitas una cuota activa para reservar eventos');
    }

    const membershipExpiresAt = this.getMembershipExpiration(
      user.membershipStartedAt,
    );

    if (this.getEventStartAt(event) >= membershipExpiresAt) {
      throw new ConflictException(
        'No puedes reservar eventos posteriores a la caducidad de tu cuota',
      );
    }

    const [usedClasses, usedEvents] = await Promise.all([
      this.prisma.reservation.count({
        where: {
          userId,
          session: {
            date: {
              gte: user.membershipStartedAt,
              lt: membershipExpiresAt,
            },
          },
        },
      }),
      this.prisma.eventReservation.count({
        where: {
          userId,
          event: {
            eventDate: {
              gte: user.membershipStartedAt,
              lt: membershipExpiresAt,
            },
          },
        },
      }),
    ]);

    if (usedClasses + usedEvents >= plan.monthlyClassLimit) {
      throw new ConflictException(
        'No te quedan asistencias disponibles en tu cuota',
      );
    }
  }

  async create(dto: CreateEventoDto) {
    const name = this.normalizarTexto(dto.name);
    const description = this.normalizarTexto(dto.description);

    if (!name) {
      throw new BadRequestException('El nombre del evento es obligatorio');
    }

    if (!description) {
      throw new BadRequestException('La descripcion del evento es obligatoria');
    }

    const eventDate = this.buildEventDate(dto.day, dto.month, dto.year);
    const startTime = this.normalizarHora(dto.startTime);
    const endTime = this.normalizarHora(dto.endTime || '23:59');

    this.validarRangoHorario(startTime, endTime);

    if (dto.capacity < 1) {
      throw new BadRequestException('La capacidad debe ser mayor que cero');
    }

    return this.prisma.event.create({
      data: {
        name,
        description,
        eventDate,
        startTime,
        endTime,
        capacity: dto.capacity,
      },
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: number) {
    const evento = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }

    return evento;
  }

  async update(id: number, dto: UpdateEventoDto) {
    const actual = await this.findOne(id);

    const name = this.normalizarTexto(dto.name) ?? actual.name;
    const description =
      this.normalizarTexto(dto.description) ?? actual.description;

    const hasDatePart =
      dto.day !== undefined ||
      dto.month !== undefined ||
      dto.year !== undefined;
    let eventDate = actual.eventDate;

    if (hasDatePart) {
      if (
        dto.day === undefined ||
        dto.month === undefined ||
        dto.year === undefined
      ) {
        throw new BadRequestException(
          'Para editar la fecha debes indicar dia, mes y anio',
        );
      }

      eventDate = this.buildEventDate(dto.day, dto.month, dto.year);
    }

    const capacity = dto.capacity ?? actual.capacity;
    const startTime = dto.startTime
      ? this.normalizarHora(dto.startTime)
      : actual.startTime;
    const endTime = dto.endTime ? this.normalizarHora(dto.endTime) : actual.endTime;

    this.validarRangoHorario(startTime, endTime);

    if (capacity < 1) {
      throw new BadRequestException('La capacidad debe ser mayor que cero');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        eventDate,
        startTime,
        endTime,
        capacity,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async reserve(eventId: number, userId: number) {
    const event = await this.findOne(eventId);

    const existing = await this.prisma.eventReservation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (existing) {
      throw new ConflictException('Ya tienes una reserva para este evento');
    }

    await this.assertUserCanReserveEvent(userId, event);

    const currentCount = await this.prisma.eventReservation.count({
      where: { eventId },
    });

    if (currentCount >= event.capacity) {
      throw new ConflictException('No hay cupo disponible para este evento');
    }

    return this.prisma.eventReservation.create({
      data: { eventId, userId },
    });
  }

  async cancelReservation(eventId: number, userId: number) {
    const reservation = await this.prisma.eventReservation.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!reservation) {
      throw new NotFoundException('No tienes una reserva para este evento');
    }

    return this.prisma.eventReservation.delete({
      where: { id: reservation.id },
    });
  }

  async listReservationsForUser(userId: number) {
    return this.prisma.eventReservation.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
      include: { event: true },
    });
  }

  async countReservations(eventId: number) {
    await this.findOne(eventId);

    const count = await this.prisma.eventReservation.count({
      where: { eventId },
    });

    return { eventId, count };
  }
}
