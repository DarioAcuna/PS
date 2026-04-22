import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Clase, CreateClaseDto, UpdateClaseDto } from './clases.models';

@Injectable({ providedIn: 'root' })
export class ClasesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/clases`;

  findAll(): Observable<Clase[]> {
    return this.http.get<Clase[]>(this.endpoint);
  }

  findOne(id: number): Observable<Clase> {
    return this.http.get<Clase>(`${this.endpoint}/${id}`);
  }

  create(payload: CreateClaseDto): Observable<Clase> {
    return this.http.post<Clase>(this.endpoint, payload);
  }

  update(id: number, payload: UpdateClaseDto): Observable<Clase> {
    return this.http.patch<Clase>(`${this.endpoint}/${id}`, payload);
  }

  remove(id: number): Observable<Clase> {
    return this.http.delete<Clase>(`${this.endpoint}/${id}`);
  }
}
