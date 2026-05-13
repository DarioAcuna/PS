import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import {
  ConteoReservas,
  CreateReservaDto,
  ListarReservasDto,
  Reserva,
  ReservaConSesion,
  ReservaDetalle,
} from './reservas.models';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/reservas`;
  private readonly authOptions = { withCredentials: true };

  create(payload: CreateReservaDto): Observable<Reserva> {
    return this.http.post<Reserva>(this.endpoint, payload, this.authOptions);
  }

  findAll(query?: ListarReservasDto): Observable<ReservaDetalle[]> {
    let params = new HttpParams();

    if (query?.sessionId) {
      params = params.set('sessionId', query.sessionId.toString());
    }

    if (query?.userId) {
      params = params.set('userId', query.userId.toString());
    }

    return this.http.get<ReservaDetalle[]>(this.endpoint, {
      ...this.authOptions,
      params,
    });
  }

  findMine(): Observable<ReservaConSesion[]> {
    return this.http.get<ReservaConSesion[]>(
      `${this.endpoint}/mis`,
      this.authOptions,
    );
  }

  count(sessionId: number): Observable<ConteoReservas> {
    const params = new HttpParams().set('sessionId', sessionId.toString());
    return this.http.get<ConteoReservas>(`${this.endpoint}/contador`, {
      ...this.authOptions,
      params,
    });
  }

  cancel(sessionId: number): Observable<Reserva> {
    return this.http.delete<Reserva>(
      `${this.endpoint}/sesion/${sessionId}`,
      this.authOptions,
    );
  }

  remove(id: number): Observable<Reserva> {
    return this.http.delete<Reserva>(`${this.endpoint}/${id}`, this.authOptions);
  }
}

