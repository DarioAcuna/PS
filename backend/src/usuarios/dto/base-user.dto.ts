import {
  IsEmail,
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { UsuarioEstado, UsuarioTipo } from './usuario.enums';

export class BaseUserDto {
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  belt: string;

  @IsInt()
  @Min(0)
  @Max(4)
  beltDegree: number;

  @IsEnum(UsuarioTipo)
  memberType: UsuarioTipo;

  @IsEnum(UsuarioEstado)
  status: UsuarioEstado;
}
