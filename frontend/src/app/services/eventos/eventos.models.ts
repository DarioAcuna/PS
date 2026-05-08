export interface Evento {
  id: number;
  name: string;
  description: string;
  capacity: number;
  eventDate: string;
  createdAt: string;
}

export interface CreateEventoDto {
  name: string;
  description: string;
  day: number;
  month: number;
  year: number;
  capacity: number;
}

export interface UpdateEventoDto {
  name?: string;
  description?: string;
  day?: number;
  month?: number;
  year?: number;
  capacity?: number;
}

