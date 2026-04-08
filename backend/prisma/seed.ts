import 'dotenv/config';
import { PrismaClient, SessionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.session.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.clase.deleteMany();

  const clase1 = await prisma.clase.create({
    data: {
      name: 'BJJ Principiantes',
      level: 'Principiante',
    },
  });

  const clase2 = await prisma.clase.create({
    data: {
      name: 'BJJ Avanzado',
      level: 'Avanzado',
    },
  });

  const horario1 = await prisma.schedule.create({
    data: {
      classId: clase1.id,
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '19:30',
      instructor: 'Álvaro',
    },
  });

  const horario2 = await prisma.schedule.create({
    data: {
      classId: clase2.id,
      dayOfWeek: 3,
      startTime: '19:30',
      endTime: '21:00',
      instructor: 'Javier',
    },
  });

  await prisma.session.createMany({
    data: [
      {
        scheduleId: horario1.id,
        date: new Date('2026-04-06T00:00:00.000Z'),
        startTime: '18:00',
        endTime: '19:30',
        instructor: 'Álvaro',
        status: SessionStatus.SCHEDULED,
      },
      {
        scheduleId: horario2.id,
        date: new Date('2026-04-08T00:00:00.000Z'),
        startTime: '19:30',
        endTime: '21:00',
        instructor: 'Javier',
        status: SessionStatus.SCHEDULED,
      },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: 'Cambio de horario',
        content: 'La clase del lunes pasa a las 18:00.',
      },
      {
        title: 'Seminario especial',
        content: 'Este sábado habrá seminario con invitado.',
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
