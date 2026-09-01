import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminRouteService {
  private readonly shellPrefix = '/admin';

  link(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.basePath()}${normalizedPath}`;
  }

  private basePath(): string {
    return window.location.pathname.startsWith(this.shellPrefix) ? this.shellPrefix : '';
  }
}
