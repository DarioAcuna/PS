import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClaseDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  nivel?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
