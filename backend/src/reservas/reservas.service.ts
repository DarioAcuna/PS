import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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

  async create(sessionId: number, userId: number) {
    const session = await this.getSessionWithSchedule(sessionId);

    const existing = await this.prisma.reservation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (existing) {
      throw new ConflictException('Ya tienes una reserva para esta sesion');
    }

    const currentCount = await this.prisma.reservation.count({
      where: { sessionId },
    });

    if (currentCount >= session.schedule.maxCapacity) {
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
    const reserva = await this.prisma.reservation.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (!reserva) {
      throw new NotFoundException('No tienes una reserva para esta sesion');
    }

    return this.prisma.reservation.delete({ where: { id: reserva.id } });
  }
}

