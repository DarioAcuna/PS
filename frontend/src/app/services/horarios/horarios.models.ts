import { Clase } from '../clases/clases.models';

export interface Horario {
  id: number;
  classId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  createdAt: string;
  class: Clase;
}

export interface CreateHorarioDto {
  classId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
}

export interface UpdateHorarioDto {
  classId?: number;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  maxCapacity?: number;
}

