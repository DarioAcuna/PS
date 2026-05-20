import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
} from './pagos.models';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_BASE_URL}/pagos`;

  createCheckoutSession(
    payload: CheckoutSessionRequest,
  ): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.endpoint}/checkout-session`,
      payload,
      { withCredentials: true },
    );
  }
}
