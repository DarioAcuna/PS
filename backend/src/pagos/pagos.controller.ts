import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfirmCheckoutSessionDto } from './dto/confirm-checkout-session.dto';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { PagosService } from './pagos.service';

interface AuthRequest extends Request {
  user?: {
    sub?: number;
    email?: string;
  };
}

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return this.pagosService.createCheckoutSession(dto.planId, {
      id: userId,
      email: req.user?.email,
    });
  }

  @Post('confirm-checkout-session')
  @UseGuards(JwtAuthGuard)
  confirmCheckoutSession(
    @Body() dto: ConfirmCheckoutSessionDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    return this.pagosService.confirmCheckoutSession(dto.sessionId, {
      id: userId,
      email: req.user?.email,
    });
  }
}
