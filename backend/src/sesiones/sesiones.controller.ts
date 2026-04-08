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
} from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { ListarSesionesDto } from './dto/listar-sesiones.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { GenerarSesionesDto } from './dto/generar-sesiones.dto';

@Controller('sesiones')
export class SesionesController {
  constructor(private readonly sesionesService: SesionesService) {}

  @Get()
  findAll(@Query() query: ListarSesionesDto) {
    return this.sesionesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sesionesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSesionDto) {
    return this.sesionesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.sesionesService.remove(id);
  }

  @Post('generar')
  generar(@Body() dto: GenerarSesionesDto) {
    return this.sesionesService.generar(dto);
  }
}
