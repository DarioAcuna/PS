import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';

@Injectable()
export class AnunciosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnuncioDto) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const anuncio = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!anuncio) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    return anuncio;
  }

  async update(id: number, dto: UpdateAnuncioDto) {
    await this.findOne(id);

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
