import { IsIn } from 'class-validator';
import { PAYMENT_PLAN_IDS } from '../payment-plans';
import type { PaymentPlanId } from '../payment-plans';

export class CreateCheckoutSessionDto {
  @IsIn(PAYMENT_PLAN_IDS)
  planId: PaymentPlanId;
}
