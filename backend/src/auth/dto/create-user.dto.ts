import { IsString, MinLength, Matches } from 'class-validator';
import { BaseUserDto } from '../../usuarios/dto/base-user.dto';

export class CreateUserDto extends BaseUserDto {
  @IsString()
  @MinLength(12, {
    message: 'La contraseña debe tener al menos 12 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{12,}$/, {
    message:
      'La contraseña debe tener al menos 12 caracteres, incluir mayúsculas, minúsculas y números, y no contener espacios.',
  })
  password: string;
}
