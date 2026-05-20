export type PaymentPlanId = 'mensual' | 'premium' | 'familiar';

export interface CheckoutSessionRequest {
  planId: PaymentPlanId;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface ConfirmCheckoutSessionRequest {
  sessionId: string;
}

export interface ConfirmCheckoutSessionResponse {
  planId: PaymentPlanId;
  planName: string;
  monthlyClassLimit: number;
}
