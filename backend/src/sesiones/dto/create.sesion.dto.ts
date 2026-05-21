import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  Min,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateSesionDto {
  @Type(() => Number)
  @IsInt()
  scheduleId: number;

  @IsDateString()
  date: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

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
}
