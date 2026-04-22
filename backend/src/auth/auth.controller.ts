import { Controller, Post, Get, Delete, Body, Param, HttpException, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error en la autenticación',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.register(
        createUserDto.name,
        createUserDto.email,
        createUserDto.password,
        createUserDto.role,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al registrar usuario',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('users')
  async getAllUsers() {
    try {
      return await this.authService.getAllUsers();
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al obtener usuarios',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.authService.getUserById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Usuario no encontrado',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.authService.deleteUser(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al eliminar usuario',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}

