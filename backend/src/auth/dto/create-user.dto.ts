import { IsString, MinLength, Matches } from 'class-validator';
import { BaseUserDto } from '../../usuarios/dto/base-user.dto';

export class CreateUserDto extends BaseUserDto {
  @IsString()
  @MinLength(12, {
    message: 'La contraseña debe tener al menos 12 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{12,}$/, {
    message:
      'La contraseña debe contener mayúsculas, minúsculas y números. Los símbolos son opcionales.',
  })
  password: string;
}
