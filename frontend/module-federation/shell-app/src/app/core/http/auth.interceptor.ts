import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthFacade } from '../../state/auth/auth.facade';
import { ApiError } from './api-error';
import { ApiErrorResponse } from './api-response.model';

const authFreePaths = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/resend-verification'];

export const authInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthFacade);
  const token = auth.accessToken();
  const isAuthFree = authFreePaths.some((path) => request.url.includes(path));
  const authRequest = token && !isAuthFree ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthFree) {
        return from(auth.refreshAccessToken()).pipe(
          switchMap((newToken) => next(request.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))),
          catchError((refreshError) => throwError(() => normalizeError(refreshError))),
        );
      }

      return throwError(() => normalizeError(error));
    }),
  );
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof ApiError) return error;
  if (error instanceof HttpErrorResponse && error.error?.success === false) {
    return new ApiError(error.error as ApiErrorResponse);
  }
  if (error instanceof Error) return error;
  return new Error('Request failed. Please try again.');
};
