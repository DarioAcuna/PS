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
  status: SessionStatus;
  createdAt: string;
}

export interface SesionDetallada extends Sesion {
  schedule: HorarioResumen;
}

export interface ListarSesionesDto {
  date?: string;
}

export interface UpdateSesionDto {
  startTime?: string;
  endTime?: string;
  instructor?: string;
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

