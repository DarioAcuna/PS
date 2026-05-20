export type PaymentPlanId = 'mensual' | 'premium' | 'familiar';

export interface CheckoutSessionRequest {
  planId: PaymentPlanId;
}

export interface CheckoutSessionResponse {
  url: string;
}
