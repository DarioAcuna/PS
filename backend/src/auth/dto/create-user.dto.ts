import { IsEmail, IsString, MinLength, IsEnum, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(12, {
    message: 'La contraseña debe tener al menos 12 caracteres',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{12,}$/,
    {
      message: 'La contraseña debe contener mayúsculas, minúsculas y números. Los símbolos son opcionales.',
    },
  )
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
