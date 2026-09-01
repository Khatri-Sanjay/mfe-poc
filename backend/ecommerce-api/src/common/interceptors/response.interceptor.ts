import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import { RESPONSE_MESSAGE_METADATA } from '../decorators/response-message.decorator';
import { REQUEST_ID_HEADER } from '../constants/api.constants';
import { PaginationMetaDto } from '../dto/api-response.dto';

export interface PaginatedResult<TData> {
	items: TData[];
	meta: PaginationMetaDto;
}

export const isPaginatedResult = <TData>(value: unknown): value is PaginatedResult<TData> =>
	typeof value === 'object' && value !== null && 'items' in value && 'meta' in value;

const getRequestId = (request: Request): string => (typeof request.id === 'string' ? request.id : 'unknown-request-id');

@Injectable()
export class ResponseInterceptor<TData> implements NestInterceptor<TData> {
	constructor(private readonly reflector: Reflector) {}

	intercept(context: ExecutionContext, next: CallHandler<TData>): Observable<unknown> {
		const http = context.switchToHttp();
		const request = http.getRequest<Request>();
		const response = http.getResponse<Response>();
		const message = this.reflector.get<string>(RESPONSE_MESSAGE_METADATA, context.getHandler()) ?? 'Request completed successfully';

		const requestId = getRequestId(request);

		response.setHeader(REQUEST_ID_HEADER, requestId);

		return next.handle().pipe(
			map((body: TData) => {
				if (response.statusCode === 204) {
					return undefined;
				}

				const data = isPaginatedResult<unknown>(body) ? body.items : body;
				const meta = isPaginatedResult<unknown>(body) ? body.meta : undefined;

				return {
					success: true,
					statusCode: response.statusCode,
					message,
					data,
					...(meta ? { meta } : {}),
					timestamp: new Date().toISOString(),
					path: request.originalUrl,
					requestId
				};
			})
		);
	}
}
