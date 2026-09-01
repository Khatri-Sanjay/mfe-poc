import { ApiErrorResponse } from './api-response.model';

const friendlyMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Validation failed.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource could not be found.',
  CONFLICT: 'This action conflicts with the current data.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly requestId?: string;
  readonly errors?: unknown[];
  readonly detailMessages: string[];

  constructor(response: ApiErrorResponse) {
    const baseMessage = friendlyMessages[response.errorCode] ?? response.message ?? 'Request failed.';
    const details = validationMessages(response.errors);
    const detailText = details.length > 0 ? `\n${details.join('\n')}` : '';
    const suffix = response.requestId ? ` Reference: ${response.requestId}` : '';
    super(`${baseMessage}${detailText}${suffix}`);
    this.name = 'ApiError';
    this.statusCode = response.statusCode;
    this.errorCode = response.errorCode;
    this.requestId = response.requestId;
    this.errors = response.errors;
    this.detailMessages = details;
  }
}

const validationMessages = (errors: unknown[] | undefined): string[] => {
  if (!errors) return [];
  return errors
    .map((error) => {
      if (isRecord(error) && typeof error['message'] === 'string') return sentenceCase(error['message'].trim());
      if (typeof error === 'string') return sentenceCase(error.trim());
      return '';
    })
    .filter((message) => message.length > 0);
};

const sentenceCase = (value: string): string => {
  if (!value) return value;
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
