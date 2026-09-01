export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  errors?: unknown[];
  timestamp: string;
  path: string;
  requestId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T;
  meta: PaginationMeta;
}
