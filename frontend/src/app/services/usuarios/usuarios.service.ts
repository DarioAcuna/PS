import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { CreateUsuarioDto, UpdateUsuarioDto, Usuario } from './usuarios.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/usuarios`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  findAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.endpoint, {
      headers: this.getAuthHeaders(),
    });
  }

  findOne(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.endpoint}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  create(payload: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.endpoint, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  update(id: number, payload: UpdateUsuarioDto): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.endpoint}/${id}`, payload, {
      headers: this.getAuthHeaders(),
    });
  }

  remove(id: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.endpoint}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
}
