import { IsString, MinLength } from 'class-validator';
import { BaseUserDto } from '../../usuarios/dto/base-user.dto';

export class CreateUserDto extends BaseUserDto {
  @IsString()
  @MinLength(6)
  password: string;
}
