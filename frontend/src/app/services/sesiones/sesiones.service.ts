import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import {
  GenerarSesionesDto,
  GenerarSesionesResponse,
  ListarSesionesDto,
  Sesion,
  SesionDetallada,
  UpdateSesionDto,
} from './sesiones.models';

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/sesiones`;
  private readonly authOptions = { withCredentials: true };

  findAll(query?: ListarSesionesDto): Observable<SesionDetallada[]> {
    let params = new HttpParams();

    if (query?.date) {
      params = params.set('date', query.date);
    }

    return this.http.get<SesionDetallada[]>(this.endpoint, {
      ...this.authOptions,
      params,
    });
  }

  findOne(id: number): Observable<SesionDetallada> {
    return this.http.get<SesionDetallada>(
      `${this.endpoint}/${id}`,
      this.authOptions,
    );
  }

  update(id: number, payload: UpdateSesionDto): Observable<Sesion> {
    return this.http.patch<Sesion>(
      `${this.endpoint}/${id}`,
      payload,
      this.authOptions,
    );
  }

  remove(id: number): Observable<Sesion> {
    return this.http.delete<Sesion>(`${this.endpoint}/${id}`, this.authOptions);
  }

  generar(payload: GenerarSesionesDto): Observable<GenerarSesionesResponse> {
    return this.http.post<GenerarSesionesResponse>(
      `${this.endpoint}/generar`,
      payload,
      this.authOptions,
    );
  }
}
