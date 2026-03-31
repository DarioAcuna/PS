import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateClaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

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
