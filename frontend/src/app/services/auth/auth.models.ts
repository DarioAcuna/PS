export interface User {
  id: number;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  belt?: string | null;
  beltDegree?: number | null;
  status?: string;
  membershipPlan?: string | null;
  membershipStartedAt?: string | null;
  membership?: {
    planId: string | null;
    planName: string;
    monthlyClassLimit: number;
    usedClasses: number;
    expiresAt: string | null;
  };
  createdAt?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  belt: string;
  beltDegree: number;
  memberType: string;
  status: string;
}

