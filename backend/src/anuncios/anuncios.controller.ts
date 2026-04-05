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
import { AnunciosService } from './anuncios.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';

@Controller('anuncios')
export class AnunciosController {
    constructor(private readonly anunciosService: AnunciosService) {}

    @Post()
    create(@Body() dto: CreateAnuncioDto) {
        return this.anunciosService.create(dto);
    }

    @Get()
    findAll() {
        return this.anunciosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.anunciosService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAnuncioDto,
    ) {
        return this.anunciosService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.anunciosService.remove(id);
    }
}