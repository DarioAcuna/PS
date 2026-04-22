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
  name: string;
  email: string;
  password: string;
  role: string;
}

