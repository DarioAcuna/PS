import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PAYMENT_PLANS } from './payment-plans';
import type { PaymentPlanId } from './payment-plans';

interface CheckoutUser {
  id: number;
  email?: string;
}

@Injectable()
export class PagosService {
  private stripe?: InstanceType<typeof Stripe>;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
  }

  async createCheckoutSession(planId: PaymentPlanId, user: CheckoutUser) {
    const plan = PAYMENT_PLANS[planId];

    if (!plan) {
      throw new NotFoundException('Cuota no encontrada');
    }

    const stripe = this.getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      client_reference_id: String(user.id),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: plan.amountInCents,
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
        },
      ],
      metadata: {
        userId: String(user.id),
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          userId: String(user.id),
          planId: plan.id,
        },
      },
      success_url: `${this.frontendUrl}/pago?resultado=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/pago?resultado=cancel`,
    });

    return { url: session.url };
  }

  private getStripeClient(): InstanceType<typeof Stripe> {
    if (this.stripe) {
      return this.stripe;
    }

    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new InternalServerErrorException('Falta STRIPE_SECRET_KEY');
    }

    if (!secretKey.startsWith('sk_test_')) {
      throw new InternalServerErrorException(
        'Stripe debe estar configurado con una clave de prueba sk_test_',
      );
    }

    this.stripe = new Stripe(secretKey);
    return this.stripe;
  }
}
