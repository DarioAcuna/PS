import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { ListarReservasDto } from './dto/listar-reservas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

interface AuthRequest extends Request {
  user?: {
    sub?: number;
    role?: string;
  };
}

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  /**
   * Crear una reserva para la sesion
   * ALUMNO, PROFESOR y ADMIN pueden reservar
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateReservaDto, @Req() req: AuthRequest) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return this.reservasService.create(dto.sessionId, userId);
  }

  /**
   * Listar reservas (con datos del usuario)
   * Solo ADMIN puede ver
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  findAll(@Query() query: ListarReservasDto) {
    return this.reservasService.list(query);
  }

  /**
   * Listar reservas del usuario autenticado
   */
  @Get('mis')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthRequest) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return this.reservasService.listForUser(userId);
  }

  /**
   * Contar reservas de una sesion
   */
  @Get('contador')
  @UseGuards(JwtAuthGuard)
  count(@Query('sessionId', ParseIntPipe) sessionId: number) {
    return this.reservasService.countForSession(sessionId);
  }

  /**
   * Listar participantes de una sesion
   */
  @Get('sesion/:sessionId')
  @UseGuards(JwtAuthGuard)
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.reservasService.listForSession(sessionId);
  }

  /**
   * Cancelar reserva del usuario en una sesion
   */
  @Delete('sesion/:sessionId')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return this.reservasService.cancelForUser(sessionId, userId);
  }

  /**
   * Eliminar una reserva
   * Solo ADMIN puede borrar
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.remove(id);
  }
}

