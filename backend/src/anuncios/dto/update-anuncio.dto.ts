import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAnuncioDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    titulo?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    contenido?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}