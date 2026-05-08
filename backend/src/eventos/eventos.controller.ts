import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  /**
   * Crear evento
   * Solo ADMIN puede crear
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  create(@Body() dto: CreateEventoDto) {
    return this.eventosService.create(dto);
  }

  /**
   * Listar todos los eventos
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.eventosService.findAll();
  }

  /**
   * Obtener un evento por ID
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.findOne(id);
  }

  /**
   * Actualizar evento
   * Solo ADMIN puede editar
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventoDto) {
    return this.eventosService.update(id, dto);
  }

  /**
   * Eliminar evento
   * Solo ADMIN puede borrar
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.eventosService.remove(id);
  }
}
