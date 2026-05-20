export interface Evento {
  id: number;
  name: string;
  description: string;
  capacity: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface CreateEventoDto {
  name: string;
  description: string;
  day: number;
  month: number;
  year: number;
  startTime: string;
  endTime: string;
  capacity: number;
}

export interface UpdateEventoDto {
  name?: string;
  description?: string;
  day?: number;
  month?: number;
  year?: number;
  startTime?: string;
  endTime?: string;
  capacity?: number;
}

