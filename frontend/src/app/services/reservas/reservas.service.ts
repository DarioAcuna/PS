import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Reserva, ReservaContador, ReservaDetallada } from './reservas.models';

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/reservas`;
  private readonly authOptions = { withCredentials: true };

  create(sessionId: number): Observable<Reserva> {
    return this.http.post<Reserva>(
      this.endpoint,
      { sessionId },
      this.authOptions,
    );
  }

  cancel(sessionId: number): Observable<Reserva> {
    return this.http.delete<Reserva>(
      `${this.endpoint}/sesion/${sessionId}`,
      this.authOptions,
    );
  }

  findMine(): Observable<ReservaDetallada[]> {
    return this.http.get<ReservaDetallada[]>(
      `${this.endpoint}/mis`,
      this.authOptions,
    );
  }

  countForSession(sessionId: number): Observable<ReservaContador> {
    const params = new HttpParams().set('sessionId', sessionId);

    return this.http.get<ReservaContador>(
      `${this.endpoint}/contador`,
      {
        ...this.authOptions,
        params,
      },
    );
  }

  findBySession(sessionId: number): Observable<ReservaDetallada[]> {
    return this.http.get<ReservaDetallada[]>(
      `${this.endpoint}/sesion/${sessionId}`,
      this.authOptions,
    );
  }
}
