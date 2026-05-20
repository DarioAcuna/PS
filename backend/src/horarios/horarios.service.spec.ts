import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HorariosService } from './horarios.service';

describe('HorariosService', () => {
  type PrismaMock = {
    clase: {
      findUnique: jest.Mock<Promise<unknown>, [unknown]>;
    };
    schedule: {
      count: jest.Mock<Promise<number>, [unknown]>;
      create: jest.Mock<Promise<unknown>, [unknown]>;
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
      findUnique: jest.Mock<Promise<unknown>, [unknown]>;
      update: jest.Mock<Promise<unknown>, [unknown]>;
      delete: jest.Mock<Promise<unknown>, [unknown]>;
    };
    session: {
      count: jest.Mock<Promise<number>, [unknown]>;
    };
  };

  const prisma: PrismaMock = {
    clase: {
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
    },
    schedule: {
      count: jest.fn<Promise<number>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
    },
    session: {
      count: jest.fn<Promise<number>, [unknown]>(),
    },
  };

  let service: HorariosService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HorariosService(prisma as unknown as PrismaService);
    prisma.clase.findUnique.mockResolvedValue({
      id: 1,
      name: 'BJJ',
      level: 'Beginner',
    });
  });

  it('permite crear un segundo horario solapado en la misma franja', async () => {
    prisma.schedule.count.mockResolvedValueOnce(1);
    prisma.schedule.create.mockResolvedValueOnce({ id: 2 });

    await expect(
      service.create({
        classId: 1,
        dayOfWeek: 2,
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 20,
      }),
    ).resolves.toMatchObject({ id: 2 });
  });

  it('rechaza crear un tercer horario solapado en la misma franja', async () => {
    prisma.schedule.count.mockResolvedValueOnce(2);

    await expect(
      service.create({
        classId: 1,
        dayOfWeek: 2,
        startTime: '18:00',
        endTime: '19:00',
        maxCapacity: 20,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('permite crear horario contiguo cuando no hay solape', async () => {
    prisma.schedule.count.mockResolvedValueOnce(0);
    prisma.schedule.create.mockResolvedValueOnce({ id: 3 });

    await expect(
      service.create({
        classId: 1,
        dayOfWeek: 2,
        startTime: '19:00',
        endTime: '20:00',
        maxCapacity: 20,
      }),
    ).resolves.toMatchObject({ id: 3 });
  });
});
