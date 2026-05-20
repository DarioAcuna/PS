export type SessionStatus = 'SCHEDULED' | 'MODIFIED';

export interface ClaseResumen {
  id: number;
  name: string;
  level: string | null;
  createdAt: string;
}

export interface HorarioResumen {
  id: number;
  classId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  createdAt: string;
  class: ClaseResumen;
}

export interface Sesion {
  id: number;
  scheduleId: number;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string | null;
  instructorId?: number | null;
  maxCapacity?: number | null;
  status: SessionStatus;
  className?: string | null;
  classLevel?: string | null;
  createdAt: string;
}

export interface SesionDetallada extends Sesion {
  schedule: HorarioResumen;
}

export interface ListarSesionesDto {
  date?: string;
}

export interface CreateSesionDto {
  scheduleId: number;
  date: string;
  startTime: string;
  endTime: string;
  instructor?: string;
  instructorId?: number;
  maxCapacity?: number;
}

export interface UpdateSesionDto {
  className?: string;
  classLevel?: string;
  startTime?: string;
  endTime?: string;
  instructor?: string;
  instructorId?: number;
  maxCapacity?: number;
  status?: SessionStatus;
}

export interface GenerarSesionesDto {
  year: number;
  month: number;
}

export interface GenerarSesionesResponse {
  message: string;
  total: number;
}
