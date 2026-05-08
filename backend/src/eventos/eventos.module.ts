import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EventosController } from './eventos.controller';
import { EventosService } from './eventos.service';

@Module({
  imports: [PrismaModule],
  controllers: [EventosController],
  providers: [EventosService],
})
export class EventosModule {}
