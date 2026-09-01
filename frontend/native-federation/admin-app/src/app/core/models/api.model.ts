export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiError {
  success: boolean;
  statusCode: number;
  errorCode: string;
  message: string;
  errors?: FieldError[];
  timestamp: string;
  path: string;
  requestId: string;
}

export interface FieldError {
  field: string;
  message: string;
}
