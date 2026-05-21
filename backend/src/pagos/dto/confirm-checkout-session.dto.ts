import { IsString } from 'class-validator';

export class ConfirmCheckoutSessionDto {
  @IsString()
  sessionId: string;
}
