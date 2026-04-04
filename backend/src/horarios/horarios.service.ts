import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHorarioDto } from './dto/create-horario.dto';
import { UpdateHorarioDto } from './dto/update-horario.dto';

@Injectable()
export class HorariosService {
    constructor(private readonly prisma: PrismaService) {}

    private haySolapamiento(
        inicioA: string,
        finA: string,
        inicioB: string,
        finB: string,
    ) {
        return inicioA < finB && finA > inicioB;
    }

    private async validarClaseExiste(claseId: number) {
        const clase = await this.prisma.clase.findUnique({
            where: { id: claseId },
        });

        if (!clase) {
            throw new NotFoundException('La clase indicada no existe');
        }
    }

    private async validarSolapamientos(
        diaSemana: number,
        horaInicio: string,
        horaFin: string,
        instructor?: string,
        aula?: string,
        horarioActualId?: number,
    ) {
        const horarios = await this.prisma.horario.findMany({
            where: {
                diaSemana,
                ...(horarioActualId ? { NOT: { id: horarioActualId } } : {}),
            },
        });

        for (const horario of horarios) {
            const solapa = this.haySolapamiento(
                horaInicio,
                horaFin,
                horario.horaInicio,
                horario.horaFin,
            );

            if (!solapa) continue;

            if (instructor && horario.instructor && instructor === horario.instructor) {
                throw new ConflictException(
                    'El instructor ya está ocupado en esa franja horaria',
                );
            }

            if (aula && horario.aula && aula === horario.aula) {
                throw new ConflictException(
                    'El aula ya está ocupada en esa franja horaria',
                );
            }
        }
    }

    async create(dto: CreateHorarioDto) {
        if (dto.horaInicio >= dto.horaFin) {
            throw new ConflictException(
                'La hora de inicio debe ser menor que la de fin',
            );
        }

        await this.validarClaseExiste(dto.claseId);

        await this.validarSolapamientos(
            dto.diaSemana,
            dto.horaInicio,
            dto.horaFin,
            dto.instructor,
            dto.aula,
        );

        return this.prisma.horario.create({
            data: {
                claseId: dto.claseId,
                diaSemana: dto.diaSemana,
                horaInicio: dto.horaInicio,
                horaFin: dto.horaFin,
                instructor: dto.instructor?.trim(),
                aula: dto.aula?.trim(),
            },
            include: {
                clase: true,
            },
        });
    }

    async findAll() {
        return this.prisma.horario.findMany({
            include: { clase: true },
            orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
        });
    }

    async findOne(id: number) {
        const horario = await this.prisma.horario.findUnique({
            where: { id },
            include: { clase: true },
        });

        if (!horario) {
            throw new NotFoundException('Horario no encontrado');
        }

        return horario;
    }

    async update(id: number, dto: UpdateHorarioDto) {
        const actual = await this.prisma.horario.findUnique({
            where: { id },
        });

        if (!actual) {
            throw new NotFoundException('Horario no encontrado');
        }

        const claseId = dto.claseId ?? actual.claseId;
        const diaSemana = dto.diaSemana ?? actual.diaSemana;
        const horaInicio = dto.horaInicio ?? actual.horaInicio;
        const horaFin = dto.horaFin ?? actual.horaFin;
        const instructor = dto.instructor ?? actual.instructor ?? undefined;
        const aula = dto.aula ?? actual.aula ?? undefined;

        if (horaInicio >= horaFin) {
            throw new ConflictException(
                'La hora de inicio debe ser menor que la de fin',
            );
        }

        await this.validarClaseExiste(claseId);

        await this.validarSolapamientos(
            diaSemana,
            horaInicio,
            horaFin,
            instructor,
            aula,
            id,
        );

        return this.prisma.horario.update({
            where: { id },
            data: {
                claseId,
                diaSemana,
                horaInicio,
                horaFin,
                instructor,
                aula,
            },
            include: { clase: true },
        });
    }

    async remove(id: number) {
        const horario = await this.prisma.horario.findUnique({
            where: { id },
        });

        if (!horario) {
            throw new NotFoundException('Horario no encontrado');
        }

        const sesionesAsociadas = await this.prisma.sesion.count({
            where: { horarioId: id },
        });

        if (sesionesAsociadas > 0) {
            throw new ConflictException(
                'No se puede borrar el horario porque tiene sesiones asociadas',
            );
        }

        return this.prisma.horario.delete({
            where: { id },
        });
    }
}