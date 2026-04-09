import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateSesionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  startTime?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endTime?: string;

  @IsOptional()
  @IsString()
  instructor?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
