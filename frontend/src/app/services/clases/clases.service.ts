import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Clase, CreateClaseDto, UpdateClaseDto } from './clases.models';

@Injectable({ providedIn: 'root' })
export class ClasesService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/clases`;
  private readonly authOptions = { withCredentials: true };

  findAll(): Observable<Clase[]> {
    return this.http.get<Clase[]>(this.endpoint, this.authOptions);
  }

  findOne(id: number): Observable<Clase> {
    return this.http.get<Clase>(`${this.endpoint}/${id}`, this.authOptions);
  }

  create(payload: CreateClaseDto): Observable<Clase> {
    return this.http.post<Clase>(this.endpoint, payload, this.authOptions);
  }

  update(id: number, payload: UpdateClaseDto): Observable<Clase> {
    return this.http.patch<Clase>(
      `${this.endpoint}/${id}`,
      payload,
      this.authOptions,
    );
  }

  remove(id: number): Observable<Clase> {
    return this.http.delete<Clase>(`${this.endpoint}/${id}`, this.authOptions);
  }
}
