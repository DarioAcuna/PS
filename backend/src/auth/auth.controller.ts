import { Body, Controller, Post, UseGuards, Response } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login con rate limiting estricto
   * Máximo 5 intentos por 15 minutos
   * Token guardado en httpOnly cookie (no retorna en respuesta)
   */
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ long: { limit: 5, ttl: 900000 } })
  async login(@Body() loginDto: LoginDto, @Response() res: ExpressResponse) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    // Guardar el token en una cookie httpOnly
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Retornar datos del usuario pero NO el token
    res.json({
      user: result.user,
      message: 'Login exitoso',
    });
  }

  /**
   * Register con rate limiting moderado
   * Máximo 3 registros por 15 minutos por IP
   * Previene spam de registros
   */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ long: { limit: 3, ttl: 900000 } })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(
      createUserDto.name,
      createUserDto.email,
      createUserDto.password,
      createUserDto.role,
    );
  }

  /**
   * Logout - Limpia la cookie httpOnly
   */
  @Post('logout')
  async logout(@Response() res: ExpressResponse) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.json({ message: 'Logout exitoso' });
  }
}
