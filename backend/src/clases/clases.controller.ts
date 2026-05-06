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
import { ClasesService } from './clases.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';

@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  /**
   * Crear clase
   * Solo ADMIN puede crear
   */
  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  create(@Body() createClaseDto: CreateClaseDto) {
    return this.clasesService.create(createClaseDto);
  }

  /**
   * Listar todas las clases
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.clasesService.findAll();
  }

  /**
   * Obtener una clase por ID
   * ALUMNO, PROFESOR y ADMIN pueden ver
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clasesService.findOne(id);
  }

  /**
   * Actualizar clase
   * Solo ADMIN puede editar
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClaseDto: UpdateClaseDto,
  ) {
    return this.clasesService.update(id, updateClaseDto);
  }

  /**
   * Eliminar clase
   * Solo ADMIN puede borrar
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clasesService.remove(id);
  }
}
