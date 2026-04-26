import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }
}

