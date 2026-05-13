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

