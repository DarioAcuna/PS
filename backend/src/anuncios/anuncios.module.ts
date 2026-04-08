import { Module } from '@nestjs/common';
import { AnunciosController } from './anuncios.controller';
import { AnunciosService } from './anuncios.service';

@Module({
  controllers: [AnunciosController],
  providers: [AnunciosService],
})
export class AnunciosModule {}
