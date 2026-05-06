import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UsuarioEstado, UsuarioTipo } from './usuario.enums';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  belt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(4)
  beltDegree?: number;

  @IsOptional()
  @IsEnum(UsuarioTipo)
  memberType?: UsuarioTipo;

  @IsOptional()
  @IsEnum(UsuarioEstado)
  status?: UsuarioEstado;

  @IsOptional()
  @IsEnum(['ADMIN', 'PROFESOR', 'ALUMNO'])
  role?: string;
}
