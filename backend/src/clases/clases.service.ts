import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClaseDto } from './dto/create-clase.dto';
import { UpdateClaseDto } from './dto/update-clase.dto';

@Injectable()
export class ClasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClaseDto: CreateClaseDto) {
    const nombreLimpio = createClaseDto.nombre.trim();

    if (!nombreLimpio) {
      throw new ConflictException('El nombre de la clase es obligatorio');
    }

    const existente = await this.prisma.clase.findUnique({
      where: { nombre: nombreLimpio },
    });

    if (existente) {
      throw new ConflictException('Ya existe una clase con ese nombre');
    }

    return this.prisma.clase.create({
      data: {
        nombre: nombreLimpio,
        descripcion: createClaseDto.descripcion?.trim(),
        nivel: createClaseDto.nivel?.trim(),
        activa: createClaseDto.activa ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.clase.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const clase = await this.prisma.clase.findUnique({
      where: { id },
    });

    if (!clase) {
      throw new NotFoundException('Clase no encontrada');
    }

    return clase;
  }

  async update(id: number, updateClaseDto: UpdateClaseDto) {
    await this.findOne(id);

    if (updateClaseDto.nombre) {
      const nombreLimpio = updateClaseDto.nombre.trim();

      const existente = await this.prisma.clase.findUnique({
        where: { nombre: nombreLimpio },
      });

      if (existente && existente.id !== id) {
        throw new ConflictException('Ya existe otra clase con ese nombre');
      }

      updateClaseDto.nombre = nombreLimpio;
    }

    return this.prisma.clase.update({
      where: { id },
      data: {
        ...updateClaseDto,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const horariosAsociados = await this.prisma.horario.count({
      where: { claseId: id },
    });

    if (horariosAsociados > 0) {
      throw new ConflictException(
        'No se puede borrar la clase porque tiene horarios asignados',
      );
    }

    return this.prisma.clase.delete({
      where: { id },
    });
  }
}
