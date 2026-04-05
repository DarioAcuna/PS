import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnuncioDto {
    @IsString()
    @IsNotEmpty()
    titulo: string;

    @IsString()
    @IsNotEmpty()
    contenido: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}