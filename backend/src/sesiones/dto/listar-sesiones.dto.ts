import { IsDateString, IsOptional } from 'class-validator';

export class ListarSesionesDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
