import { ConflictException, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SesionesService } from './sesiones.service';

describe('SesionesService', () => {
  type PrismaMock = {
    session: {
      findUnique: jest.Mock<Promise<unknown>, [unknown]>;
      findFirst: jest.Mock<Promise<unknown>, [unknown]>;
      update: jest.Mock<Promise<unknown>, [unknown]>;
      delete: jest.Mock<Promise<unknown>, [unknown]>;
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
      count: jest.Mock<Promise<number>, [unknown]>;
      createMany: jest.Mock<Promise<unknown>, [unknown]>;
    };
    schedule: {
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
    };
  };

  const prisma: PrismaMock = {
    session: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
      createMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    schedule: {
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
    },
  };

  let service: SesionesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SesionesService(prisma as unknown as PrismaService);
  });

  it('rechaza dos sesiones con mismo instructor en mismo dia y franja', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 1,
      date: new Date('2026-04-08T00:00:00.000Z'),
      startTime: '18:00',
      endTime: '19:00',
      instructor: 'Javier',
      status: SessionStatus.SCHEDULED,
    });

    prisma.session.findFirst.mockResolvedValueOnce({
      id: 2,
      instructor: 'Javier',
    });

    await expect(
      service.update(1, {
        instructor: 'Javier',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite actualizar si no existe conflicto de instructor en esa franja', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({
      id: 1,
      date: new Date('2026-04-08T00:00:00.000Z'),
      startTime: '18:00',
      endTime: '19:00',
      instructor: 'Javier',
      status: SessionStatus.SCHEDULED,
    });

    prisma.session.findFirst.mockResolvedValueOnce(null);
    prisma.session.update.mockResolvedValueOnce({
      id: 1,
      instructor: 'Javier',
    });

    await expect(
      service.update(1, {
        instructor: 'Javier',
      }),
    ).resolves.toMatchObject({ id: 1, instructor: 'Javier' });
  });

  it('borra una sesion existente con remove', async () => {
    prisma.session.findUnique.mockResolvedValueOnce({ id: 3 });
    prisma.session.delete.mockResolvedValueOnce({ id: 3 });

    await expect(service.remove(3)).resolves.toMatchObject({ id: 3 });
  });

  it('lanza NotFound al borrar una sesion inexistente', async () => {
    prisma.session.findUnique.mockResolvedValueOnce(null);

    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
