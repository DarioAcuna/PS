export type UsuarioTipo = 'ALUMNO' | 'PROFESOR';
export type UsuarioEstado = 'ACTIVO' | 'INACTIVO';
export type UsuarioRol = 'ADMIN' | 'ALUMNO' | 'PROFESOR';

export interface Usuario {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: UsuarioRol;
  belt: string | null;
  beltDegree: number | null;
  status: UsuarioEstado;
  createdAt: string;
}

export interface CreateUsuarioDto {
  firstName: string;
  lastName: string;
  email: string;
  belt: string;
  beltDegree: number;
  memberType: UsuarioTipo;
  status: UsuarioEstado;
}

export interface UpdateUsuarioDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  belt?: string;
  beltDegree?: number;
  memberType?: UsuarioTipo;
  status?: UsuarioEstado;
  role?: UsuarioRol;
}

