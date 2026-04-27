import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log('✅ Usuarios en la base de datos:', users);

  const classes = await prisma.clase.findMany();
  console.log('✅ Clases en la base de datos:', classes);

  await prisma.$disconnect();
}

main().catch(console.error);

