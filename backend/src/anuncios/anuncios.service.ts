import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';

@Injectable()
export class AnunciosService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateAnuncioDto) {
        return this.prisma.anuncio.create({
            data: {
                titulo: dto.titulo.trim(),
                contenido: dto.contenido.trim(),
                activo: dto.activo ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.anuncio.findMany({
            orderBy: { publicadoEn: 'desc' },
        });
    }

    async findOne(id: number) {
        const anuncio = await this.prisma.anuncio.findUnique({
            where: { id },
        });

        if (!anuncio) {
            throw new NotFoundException('Anuncio no encontrado');
        }

        return anuncio;
    }

    async update(id: number, dto: UpdateAnuncioDto) {
        await this.findOne(id);

        return this.prisma.anuncio.update({
            where: { id },
            data: {
                ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
                ...(dto.contenido !== undefined
                    ? { contenido: dto.contenido.trim() }
                    : {}),
                ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);

        return this.prisma.anuncio.delete({
            where: { id },
        });
    }
}