export const PAYMENT_PLAN_IDS = ['mensual', 'premium', 'familiar'] as const;

export type PaymentPlanId = (typeof PAYMENT_PLAN_IDS)[number];

export interface PaymentPlan {
  id: PaymentPlanId;
  name: string;
  description: string;
  amountInCents: number;
  monthlyClassLimit: number;
}

export const PAYMENT_PLANS: Record<PaymentPlanId, PaymentPlan> = {
  mensual: {
    id: 'mensual',
    name: 'Cuota mensual',
    description: 'Acceso mensual a clases regulares.',
    amountInCents: 3900,
    monthlyClassLimit: 10,
  },
  premium: {
    id: 'premium',
    name: 'Cuota premium',
    description: 'Acceso mensual con prioridad en reservas.',
    amountInCents: 5900,
    monthlyClassLimit: 20,
  },
  familiar: {
    id: 'familiar',
    name: 'Cuota familiar',
    description: 'Cuota mensual para miembros de una unidad familiar.',
    amountInCents: 9900,
    monthlyClassLimit: 40,
  },
};
