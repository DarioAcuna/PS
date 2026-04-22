import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { CreateHorarioDto, Horario, UpdateHorarioDto } from './horarios.models';

@Injectable({ providedIn: 'root' })
export class HorariosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/horarios`;

  findAll(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.endpoint);
  }

  findOne(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.endpoint}/${id}`);
  }

  create(payload: CreateHorarioDto): Observable<Horario> {
    return this.http.post<Horario>(this.endpoint, payload);
  }

  update(id: number, payload: UpdateHorarioDto): Observable<Horario> {
    return this.http.patch<Horario>(`${this.endpoint}/${id}`, payload);
  }

  remove(id: number): Observable<Horario> {
    return this.http.delete<Horario>(`${this.endpoint}/${id}`);
  }
}

