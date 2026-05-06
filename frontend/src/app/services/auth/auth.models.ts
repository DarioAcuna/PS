export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
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

