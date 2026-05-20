import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PLANS } from '../pagos/payment-plans';
import type { PaymentPlanId } from '../pagos/payment-plans';
import { ListarReservasDto } from './dto/listar-reservas.dto';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSessionWithSchedule(sessionId: number) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { schedule: true },
    });

    if (!session) {
      throw new NotFoundException('Sesion no encontrada');
    }

    return session;
  }

  private hasSessionStarted(session: { date: Date; startTime: string }): boolean {
    const date = session.date.toISOString().slice(0, 10);
    const startAt = new Date(`${date}T${session.startTime}:00`);

    return startAt <= new Date();
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

  private getSessionStartAt(session: { date: Date; startTime: string }): Date {
    const date = session.date.toISOString().slice(0, 10);
    return new Date(`${date}T${session.startTime}:00`);
  }

  private getCurrentWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now);

    start.setDate(now.getDate() - daysFromMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
  }

  private assertDateIsInCurrentWeek(date: Date) {
    const { start, end } = this.getCurrentWeekRange();

    if (date < start || date >= end) {
      throw new ConflictException('Solo puedes reservar clases de esta semana');
    }
  }

  private async assertUserHasAvailableAttendance(
    userId: number,
    session: { date: Date; startTime: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { membershipPlan: true, membershipStartedAt: true },
    });
    const plan = user?.membershipPlan
      ? PAYMENT_PLANS[user.membershipPlan as PaymentPlanId]
      : undefined;

    if (!plan) {
      throw new ConflictException('Necesitas una cuota activa para reservar clases');
    }

    if (!user?.membershipStartedAt) {
      throw new ConflictException('Necesitas una cuota activa para reservar clases');
    }

    const membershipExpiresAt = this.getMembershipExpiration(
      user.membershipStartedAt,
    );
    const sessionStartAt = this.getSessionStartAt(session);

    this.assertDateIsInCurrentWeek(sessionStartAt);

    if (sessionStartAt >= membershipExpiresAt) {
      throw new ConflictException(
        'No puedes reservar clases posteriores a la caducidad de tu cuota',
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

  async create(sessionId: number, userId: number) {
    const session = await this.getSessionWithSchedule(sessionId);

    if (this.hasSessionStarted(session)) {
      throw new ConflictException(
        'No puedes reservar una clase que ya ha empezado o ya ha pasado',
      );
    }

    const existing = await this.prisma.reservation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (existing) {
      throw new ConflictException('Ya tienes una reserva para esta sesion');
    }

    await this.assertUserHasAvailableAttendance(userId, session);

    const currentCount = await this.prisma.reservation.count({
      where: { sessionId },
    });

    const sessionCapacity = Number((session as any).maxCapacity ?? session.schedule.maxCapacity);
    if (currentCount >= sessionCapacity) {
      throw new ConflictException('No hay cupo disponible para esta sesion');
    }

    return this.prisma.reservation.create({
      data: {
        sessionId,
        userId,
      },
    });
  }

  async list(dto: ListarReservasDto) {
    return this.prisma.reservation.findMany({
      where: {
        ...(dto.sessionId ? { sessionId: dto.sessionId } : {}),
        ...(dto.userId ? { userId: dto.userId } : {}),
      },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        user: {
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
          },
        },
        session: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            scheduleId: true,
          },
        },
      },
    });
  }

  async listForUser(userId: number) {
    return this.prisma.reservation.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }],
      include: {
        session: {
          include: {
            schedule: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });
  }

  async listForSession(sessionId: number) {
    await this.getSessionWithSchedule(sessionId);

    return this.prisma.reservation.findMany({
      where: { sessionId },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        user: {
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
          },
        },
      },
    });
  }


  async countForSession(sessionId: number) {
    await this.getSessionWithSchedule(sessionId);

    const count = await this.prisma.reservation.count({
      where: { sessionId },
    });

    return { sessionId, count };
  }

  async remove(id: number) {
    const reserva = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return this.prisma.reservation.delete({ where: { id } });
  }

  async cancelForUser(sessionId: number, userId: number) {
    const session = await this.getSessionWithSchedule(sessionId);

    if (this.hasSessionStarted(session)) {
      throw new ConflictException(
        'No puedes cancelar la asistencia de una clase ya impartida',
      );
    }

    const reserva = await this.prisma.reservation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (!reserva) {
      throw new NotFoundException('No tienes una reserva para esta sesion');
    }

    return this.prisma.reservation.delete({ where: { id: reserva.id } });
  }
}
