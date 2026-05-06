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
import { AnunciosService } from './anuncios.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

@Controller('anuncios')
export class AnunciosController {
  constructor(private readonly anunciosService: AnunciosService) {}

  /**
   * Crear anuncio
   * Solo ADMIN puede crear
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  create(@Body() dto: CreateAnuncioDto) {
    return this.anunciosService.create(dto);
  }

  /**
   * Listar todos los anuncios
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.anunciosService.findAll();
  }

  /**
   * Obtener un anuncio por ID
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.anunciosService.findOne(id);
  }

  /**
   * Actualizar anuncio
   * Solo ADMIN puede editar
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnuncioDto) {
    return this.anunciosService.update(id, dto);
  }

  /**
   * Eliminar anuncio
   * Solo ADMIN puede borrar
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.anunciosService.remove(id);
  }
}
