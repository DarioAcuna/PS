import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClaseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  level: string;
}
