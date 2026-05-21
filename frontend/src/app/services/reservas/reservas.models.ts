import { SesionDetallada } from '../sesiones/sesiones.models';

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

export interface Reserva {
  id: number;
  sessionId: number;
  userId: number;
  createdAt: string;
}

export interface ReservaDetallada extends Reserva {
  user?: ReservaUser;
  session?: SesionDetallada;
}

export interface ReservaContador {
  sessionId: number;
  count: number;
}
