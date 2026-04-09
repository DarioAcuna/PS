import { Module } from '@nestjs/common';
import { HorariosController } from './horarios.controller';
import { HorariosService } from './horarios.service';

@Module({
  controllers: [HorariosController],
  providers: [HorariosService],
})
export class HorariosModule {}
