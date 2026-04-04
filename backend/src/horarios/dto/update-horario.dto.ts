import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
    IsNotEmpty,
} from 'class-validator';

export class UpdateHorarioDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    claseId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(6)
    diaSemana?: number;

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
}