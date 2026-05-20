import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateSesionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  className?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  classLevel?: string;

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
  @Type(() => Number)
  @IsInt()
  instructorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
