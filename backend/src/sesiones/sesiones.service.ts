import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { SesionEstado } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListarSesionesDto } from './dto/listar-sesiones.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { GenerarSesionesDto } from './dto/generar-sesiones.dto';

@Injectable()
export class SesionesService {
    constructor(private readonly prisma: PrismaService) {}

    private inicioFinDia(fecha: string) {
        const inicio = new Date(`${fecha}T00:00:00.000Z`);
        const fin = new Date(`${fecha}T23:59:59.999Z`);
        return { inicio, fin };
    }

    private inicioFinMes(year: number, month: number) {
        const inicio = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const fin = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        return { inicio, fin };
    }

    private haySolapamiento(
        inicioA: string,
        finA: string,
        inicioB: string,
        finB: string,
    ) {
        return inicioA < finB && finA > inicioB;
    }

    async findAll(query: ListarSesionesDto) {
        const where = query.fecha
            ? (() => {
                const { inicio, fin } = this.inicioFinDia(query.fecha!);
                return {
                    fecha: {
                        gte: inicio,
                        lte: fin,
                    },
                };
            })()
            : {};

        return this.prisma.sesion.findMany({
            where,
            include: {
                horario: {
                    include: {
                        clase: true,
                    },
                },
            },
            orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
        });
    }

    async findOne(id: number) {
        const sesion = await this.prisma.sesion.findUnique({
            where: { id },
            include: {
                horario: {
                    include: {
                        clase: true,
                    },
                },
            },
        });

        if (!sesion) {
            throw new NotFoundException('Sesión no encontrada');
        }

        return sesion;
    }

    async update(id: number, dto: UpdateSesionDto) {
        const actual = await this.prisma.sesion.findUnique({
            where: { id },
        });

        if (!actual) {
            throw new NotFoundException('Sesión no encontrada');
        }

        const horaInicio = dto.horaInicio ?? actual.horaInicio;
        const horaFin = dto.horaFin ?? actual.horaFin;
        const instructor = dto.instructor ?? actual.instructor ?? undefined;
        const aula = dto.aula ?? actual.aula ?? undefined;

        if (horaInicio >= horaFin) {
            throw new ConflictException(
                'La hora de inicio debe ser menor que la de fin',
            );
        }

        const sesionesMismoDia = await this.prisma.sesion.findMany({
            where: {
                fecha: actual.fecha,
                NOT: { id },
                estado: { not: SesionEstado.CANCELADA },
            },
        });

        for (const sesion of sesionesMismoDia) {
            const solapa = this.haySolapamiento(
                horaInicio,
                horaFin,
                sesion.horaInicio,
                sesion.horaFin,
            );

            if (!solapa) continue;

            if (aula && sesion.aula && aula === sesion.aula) {
                throw new ConflictException(
                    'El aula ya está ocupada en esa franja horaria',
                );
            }

            if (
                instructor &&
                sesion.instructor &&
                instructor === sesion.instructor
            ) {
                throw new ConflictException(
                    'El instructor ya está ocupado en esa franja horaria',
                );
            }
        }

        return this.prisma.sesion.update({
            where: { id },
            data: {
                horaInicio,
                horaFin,
                instructor,
                aula,
                observaciones: dto.observaciones ?? actual.observaciones,
                estado: dto.estado ?? SesionEstado.MODIFICADA,
            },
        });
    }

    async cancelar(id: number) {
        const sesion = await this.prisma.sesion.findUnique({
            where: { id },
        });

        if (!sesion) {
            throw new NotFoundException('Sesión no encontrada');
        }

        if (sesion.estado === SesionEstado.CANCELADA) {
            throw new ConflictException('La sesión ya está cancelada');
        }

        return this.prisma.sesion.update({
            where: { id },
            data: {
                estado: SesionEstado.CANCELADA,
            },
        });
    }

    async generar(dto: GenerarSesionesDto) {
        const horarios = await this.prisma.horario.findMany({
            include: { clase: true },
            orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
        });

        if (horarios.length === 0) {
            throw new ConflictException(
                'No hay horarios base configurados para generar sesiones',
            );
        }

        const { inicio, fin } = this.inicioFinMes(dto.year, dto.month);

        const yaExisten = await this.prisma.sesion.count({
            where: {
                fecha: {
                    gte: inicio,
                    lte: fin,
                },
            },
        });

        if (yaExisten > 0) {
            throw new ConflictException(
                'Las sesiones de ese mes ya fueron generadas previamente',
            );
        }

        const data: {
            horarioId: number;
            fecha: Date;
            horaInicio: string;
            horaFin: string;
            instructor?: string | null;
            aula?: string | null;
            estado: SesionEstado;
        }[] = [];

        const ultimoDia = new Date(Date.UTC(dto.year, dto.month, 0)).getUTCDate();

        for (let day = 1; day <= ultimoDia; day++) {
            const fecha = new Date(Date.UTC(dto.year, dto.month - 1, day));
            const diaSemana = fecha.getUTCDay();

            for (const horario of horarios) {
                if (horario.diaSemana !== diaSemana) continue;

                data.push({
                    horarioId: horario.id,
                    fecha,
                    horaInicio: horario.horaInicio,
                    horaFin: horario.horaFin,
                    instructor: horario.instructor,
                    aula: horario.aula,
                    estado: SesionEstado.PROGRAMADA,
                });
            }
        }

        await this.prisma.sesion.createMany({
            data,
        });

        return {
            message: 'Sesiones generadas correctamente',
            total: data.length,
        };
    }
}