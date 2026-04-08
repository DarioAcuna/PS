import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async health() {
    const totalClasses = await this.prisma.clase.count();

    return {
      ok: true,
      classes: totalClasses,
    };
  }
}
