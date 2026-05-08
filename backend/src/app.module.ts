import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ClasesModule } from './clases/clases.module';
import { HorariosModule } from './horarios/horarios.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { AnunciosModule } from './anuncios/anuncios.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EventosModule } from './eventos/eventos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configurar rate limiting global
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 3, // máximo 3 requests por segundo (para burst de requests)
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minuto
        limit: 30, // máximo 30 requests por minuto
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutos
        limit: 100, // máximo 100 requests por 15 minutos
      },
    ]),
    PrismaModule,
    AuthModule,
    ClasesModule,
    HorariosModule,
    SesionesModule,
    AnunciosModule,
    UsuariosModule,
    EventosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
