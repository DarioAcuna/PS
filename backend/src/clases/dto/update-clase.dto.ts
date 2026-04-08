import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateClaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  level?: string;
}
