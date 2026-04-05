import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { SesionEstado } from '@prisma/client';

export class UpdateSesionDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    horaInicio?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    horaFin?: string;

    @IsOptional()
    @IsString()
    instructor?: string;

    @IsOptional()
    @IsString()
    aula?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsEnum(SesionEstado)
    estado?: SesionEstado;
}