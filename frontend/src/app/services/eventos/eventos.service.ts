import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import {
  CreateEventoDto,
  Evento,
  EventoReserva,
  EventoReservaCounter,
  UpdateEventoDto,
} from './eventos.models';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/eventos`;
  private readonly authOptions = { withCredentials: true };

  findAll(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.endpoint, this.authOptions);
  }

  findOne(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.endpoint}/${id}`, this.authOptions);
  }

  create(payload: CreateEventoDto): Observable<Evento> {
    return this.http.post<Evento>(this.endpoint, payload, this.authOptions);
  }

  update(id: number, payload: UpdateEventoDto): Observable<Evento> {
    return this.http.patch<Evento>(`${this.endpoint}/${id}`, payload, this.authOptions);
  }

  remove(id: number): Observable<Evento> {
    return this.http.delete<Evento>(`${this.endpoint}/${id}`, this.authOptions);
  }

  findMineReservations(): Observable<EventoReserva[]> {
    return this.http.get<EventoReserva[]>(
      `${this.endpoint}/reservas/mis`,
      this.authOptions,
    );
  }

  reserve(id: number): Observable<EventoReserva> {
    return this.http.post<EventoReserva>(
      `${this.endpoint}/${id}/reservas`,
      {},
      this.authOptions,
    );
  }

  cancelReservation(id: number): Observable<EventoReserva> {
    return this.http.delete<EventoReserva>(
      `${this.endpoint}/${id}/reservas`,
      this.authOptions,
    );
  }

  countReservations(id: number): Observable<EventoReservaCounter> {
    return this.http.get<EventoReservaCounter>(
      `${this.endpoint}/${id}/reservas/contador`,
      this.authOptions,
    );
  }
}
