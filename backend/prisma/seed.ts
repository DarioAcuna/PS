import "dotenv/config";
import { PrismaClient, SesionEstado } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.sesion.deleteMany();
  await prisma.horario.deleteMany();
  await prisma.anuncio.deleteMany();
  await prisma.clase.deleteMany();

  const clase1 = await prisma.clase.create({
    data: {
      nombre: "BJJ Principiantes",
      descripcion: "Clase para alumnos que empiezan",
      nivel: "Principiante",
    },
  });

  const clase2 = await prisma.clase.create({
    data: {
      nombre: "BJJ Avanzado",
      descripcion: "Clase técnica avanzada",
      nivel: "Avanzado",
    },
  });

  const horario1 = await prisma.horario.create({
    data: {
      claseId: clase1.id,
      diaSemana: 1,
      horaInicio: "18:00",
      horaFin: "19:30",
      instructor: "Álvaro",
      aula: "Tatami 1",
    },
  });

  const horario2 = await prisma.horario.create({
    data: {
      claseId: clase2.id,
      diaSemana: 3,
      horaInicio: "19:30",
      horaFin: "21:00",
      instructor: "Javier",
      aula: "Tatami 1",
    },
  });

  await prisma.sesion.createMany({
    data: [
      {
        horarioId: horario1.id,
        fecha: new Date("2026-04-06T00:00:00.000Z"),
        horaInicio: "18:00",
        horaFin: "19:30",
        instructor: "Álvaro",
        aula: "Tatami 1",
        estado: SesionEstado.PROGRAMADA,
      },
      {
        horarioId: horario2.id,
        fecha: new Date("2026-04-08T00:00:00.000Z"),
        horaInicio: "19:30",
        horaFin: "21:00",
        instructor: "Javier",
        aula: "Tatami 1",
        estado: SesionEstado.PROGRAMADA,
      },
    ],
  });

  await prisma.anuncio.createMany({
    data: [
      {
        titulo: "Cambio de horario",
        contenido: "La clase del lunes pasa a las 18:00.",
      },
      {
        titulo: "Seminario especial",
        contenido: "Este sábado habrá seminario con invitado.",
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
