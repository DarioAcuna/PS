import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateReservaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId: number;
}

