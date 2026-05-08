import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { ListarSesionesDto } from './dto/listar-sesiones.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { GenerarSesionesDto } from './dto/generar-sesiones.dto';
import { CreateSesionDto } from './dto/create.sesion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

@Controller('sesiones')
export class SesionesController {
  constructor(private readonly sesionesService: SesionesService) {}

  /**
   * Crear una sesión concreta
   * Solo ADMIN puede crear
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  create(@Body() dto: CreateSesionDto) {
    return this.sesionesService.create(dto);
  }

  /**
   * Listar todas las sesiones
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: ListarSesionesDto) {
    return this.sesionesService.findAll(query);
  }

  /**
   * Obtener una sesión por ID
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sesionesService.findOne(id);
  }

  /**
   * Actualizar sesión
   * Solo ADMIN puede editar
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSesionDto) {
    return this.sesionesService.update(id, dto);
  }

  /**
   * Eliminar sesión
   * Solo ADMIN puede borrar
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sesionesService.remove(id);
  }

  /**
   * Generar sesiones
   * Solo ADMIN puede generar
   */
  @Post('generar')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  generar(@Body() dto: GenerarSesionesDto) {
    return this.sesionesService.generar(dto);
  }
}
