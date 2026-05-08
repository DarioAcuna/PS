import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClasesService } from './clases.service';

describe('ClasesService', () => {
  type PrismaMock = {
    clase: {
      findFirst: jest.Mock<Promise<unknown>, [unknown]>;
      create: jest.Mock<Promise<unknown>, [unknown]>;
      findUnique: jest.Mock<Promise<unknown>, [unknown]>;
      findMany: jest.Mock<Promise<unknown[]>, [unknown]>;
      update: jest.Mock<Promise<unknown>, [unknown]>;
      count: jest.Mock<Promise<number>, [unknown]>;
      delete: jest.Mock<Promise<unknown>, [unknown]>;
    };
    schedule: {
      count: jest.Mock<Promise<number>, [unknown]>;
      findMany: jest.Mock<Promise<{ id: number }[]>, [unknown]>;
      deleteMany: jest.Mock<Promise<unknown>, [unknown]>;
    };
    session: {
      deleteMany: jest.Mock<Promise<unknown>, [unknown]>;
    };
    $transaction: jest.Mock<Promise<unknown>, [(tx: PrismaMock) => Promise<unknown>]>;
  };

  const prisma: PrismaMock = {
    clase: {
      findFirst: jest.fn<Promise<unknown>, [unknown]>(),
      create: jest.fn<Promise<unknown>, [unknown]>(),
      findUnique: jest.fn<Promise<unknown>, [unknown]>(),
      findMany: jest.fn<Promise<unknown[]>, [unknown]>(),
      update: jest.fn<Promise<unknown>, [unknown]>(),
      count: jest.fn<Promise<number>, [unknown]>(),
      delete: jest.fn<Promise<unknown>, [unknown]>(),
    },
    schedule: {
      count: jest.fn<Promise<number>, [unknown]>(),
      findMany: jest.fn<Promise<{ id: number }[]>, [unknown]>(),
      deleteMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    session: {
      deleteMany: jest.fn<Promise<unknown>, [unknown]>(),
    },
    $transaction: jest.fn<Promise<unknown>, [(tx: PrismaMock) => Promise<unknown>]>(),
  };

  let service: ClasesService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation((callback) => callback(prisma));
    service = new ClasesService(prisma as unknown as PrismaService);
  });

  it('permite crear clases con mismo nombre si el nivel es distinto', async () => {
    prisma.clase.findFirst.mockResolvedValueOnce(null);
    prisma.clase.create.mockResolvedValueOnce({
      id: 1,
      name: 'BJJ',
      level: 'Beginner',
    });

    await expect(
      service.create({ name: 'BJJ', level: 'Beginner' }),
    ).resolves.toMatchObject({ name: 'BJJ', level: 'Beginner' });

    prisma.clase.findFirst.mockResolvedValueOnce(null);
    prisma.clase.create.mockResolvedValueOnce({
      id: 2,
      name: 'BJJ',
      level: 'Advanced',
    });

    await expect(
      service.create({ name: 'BJJ', level: 'Advanced' }),
    ).resolves.toMatchObject({ name: 'BJJ', level: 'Advanced' });
  });

  it('rechaza crear clases con la misma combinacion name+level', async () => {
    prisma.clase.findFirst.mockResolvedValueOnce({
      id: 1,
      name: 'BJJ',
      level: 'Beginner',
    });

    await expect(
      service.create({ name: 'BJJ', level: 'Beginner' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('borra sesiones y horarios asociados antes de borrar la clase', async () => {
    prisma.clase.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'BJJ',
      level: 'Beginner',
    });
    prisma.schedule.findMany.mockResolvedValueOnce([{ id: 10 }, { id: 11 }]);
    prisma.session.deleteMany.mockResolvedValueOnce({ count: 3 });
    prisma.schedule.deleteMany.mockResolvedValueOnce({ count: 2 });
    prisma.clase.delete.mockResolvedValueOnce({
      id: 1,
      name: 'BJJ',
      level: 'Beginner',
    });

    await expect(service.remove(1)).resolves.toMatchObject({ id: 1 });

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { scheduleId: { in: [10, 11] } },
    });
    expect(prisma.schedule.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 11] } },
    });
    expect(prisma.clase.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
