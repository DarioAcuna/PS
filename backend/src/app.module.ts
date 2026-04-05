import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ClasesModule } from './clases/clases.module';
import { HorariosModule } from './horarios/horarios.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { AnunciosModule } from './anuncios/anuncios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ClasesModule,
    HorariosModule,
    SesionesModule,
    AnunciosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
