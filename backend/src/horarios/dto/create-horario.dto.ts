import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class CreateHorarioDto {
    @Type(() => Number)
    @IsInt()
    claseId: number;

    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(6)
    diaSemana: number;

    @IsString()
    @IsNotEmpty()
    horaInicio: string;

    @IsString()
    @IsNotEmpty()
    horaFin: string;

    @IsOptional()
    @IsString()
    instructor?: string;

    @IsOptional()
    @IsString()
    aula?: string;
}