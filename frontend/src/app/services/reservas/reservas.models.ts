export interface CreateReservaDto {
  sessionId: number;
}

export interface ListarReservasDto {
  sessionId?: number;
  userId?: number;
}

export interface Reserva {
  id: number;
  sessionId: number;
  userId: number;
  createdAt: string;
}

export interface ReservaUser {
  id: number;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  belt: string | null;
  beltDegree: number | null;
  status: string;
}

export interface ReservaSession {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  scheduleId: number;
}

export interface ReservaDetalle extends Reserva {
  user: ReservaUser;
  session: ReservaSession;
}

export interface ClaseResumen {
  id: number;
  name: string;
  level: string | null;
  createdAt: string;
}

export interface HorarioResumen {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  class: ClaseResumen;
}

export interface SesionDetalleConHorario {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  schedule: HorarioResumen;
}

export interface ReservaConSesion extends Reserva {
  session: SesionDetalleConHorario;
}

export interface ConteoReservas {
  sessionId: number;
  count: number;
}

