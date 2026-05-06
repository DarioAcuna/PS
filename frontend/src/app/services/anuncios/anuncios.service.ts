import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Anuncio, CreateAnuncioDto, UpdateAnuncioDto } from './anuncios.models';

@Injectable({ providedIn: 'root' })
export class AnunciosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/anuncios`;
  private readonly authOptions = { withCredentials: true };

  findAll(): Observable<Anuncio[]> {
    return this.http.get<Anuncio[]>(this.endpoint, this.authOptions);
  }

  findOne(id: number): Observable<Anuncio> {
    return this.http.get<Anuncio>(`${this.endpoint}/${id}`, this.authOptions);
  }

  create(payload: CreateAnuncioDto): Observable<Anuncio> {
    return this.http.post<Anuncio>(this.endpoint, payload, this.authOptions);
  }

  update(id: number, payload: UpdateAnuncioDto): Observable<Anuncio> {
    return this.http.patch<Anuncio>(
      `${this.endpoint}/${id}`,
      payload,
      this.authOptions,
    );
  }

  remove(id: number): Observable<Anuncio> {
    return this.http.delete<Anuncio>(`${this.endpoint}/${id}`, this.authOptions);
  }
}
