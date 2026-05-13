import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}

