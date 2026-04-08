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
    };
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
    },
  };

  let service: ClasesService;

  beforeEach(() => {
    jest.clearAllMocks();
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
});
