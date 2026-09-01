import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse, PaginatedData } from './api-response.model';

type QueryValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  get<T>(path: string, query?: object): Promise<T> {
    return firstValueFrom(
      this.http
        .get<ApiResponse<T>>(this.url(path), { params: this.params(query) })
        .pipe(map((response) => response.data)),
    );
  }

  getPage<T>(path: string, query?: object): Promise<PaginatedData<T[]>> {
    return firstValueFrom(
      this.http.get<ApiResponse<T[]>>(this.url(path), { params: this.params(query) }).pipe(
        map((response) => ({
          items: response.data,
          meta: response.meta ?? { page: 1, limit: response.data.length, total: response.data.length, totalPages: 1 },
        })),
      ),
    );
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return firstValueFrom(
      this.http.post<ApiResponse<T>>(this.url(path), body ?? {}, { headers }).pipe(map((response) => response.data)),
    );
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return firstValueFrom(
      this.http.patch<ApiResponse<T>>(this.url(path), body ?? {}).pipe(map((response) => response.data)),
    );
  }

  delete<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.delete<ApiResponse<T>>(this.url(path)).pipe(map((response) => response.data)));
  }

  private url(path: string): string {
    return `${this.config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private params(query?: object): HttpParams {
    let params = new HttpParams();
    Object.entries(query ?? {}).forEach(([key, value]: [string, QueryValue]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
