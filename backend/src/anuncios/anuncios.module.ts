import { Module } from '@nestjs/common';
import { AnunciosController } from './anuncios.controller';
import { AnunciosService } from './anuncios.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AnunciosController],
  providers: [AnunciosService],
})
export class AnunciosModule {}
