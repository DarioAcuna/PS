export interface Clase {
  id: number;
  name: string;
  level: string | null;
  createdAt: string;
}

export interface CreateClaseDto {
  name: string;
  level: string;
}

export interface UpdateClaseDto {
  name?: string;
  level?: string;
}

