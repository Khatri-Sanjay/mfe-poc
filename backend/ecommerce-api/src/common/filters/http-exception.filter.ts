import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';

interface ValidationErrorDetail {
	field: string;
	message: string;
}

interface KnownErrorResponse {
	errorCode?: string;
	message?: string | string[];
	errors?: ValidationErrorDetail[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const context = host.switchToHttp();
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();
		const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
		const normalized = this.normalizeExceptionResponse(statusCode, exceptionResponse);

		if (statusCode >= 500) {
			this.logger.error(
				{
					requestId: request.id,
					method: request.method,
					path: request.originalUrl,
					err: exception
				},
				'Unhandled application error'
			);
		}

		response.status(statusCode).json({
			success: false,
			statusCode,
			errorCode: normalized.errorCode,
			message: normalized.message,
			...(normalized.errors.length > 0 ? { errors: normalized.errors } : {}),
			timestamp: new Date().toISOString(),
			path: request.originalUrl,
			requestId: request.id
		});
	}

	private normalizeExceptionResponse(
		statusCode: number,
		exceptionResponse: string | object | undefined
	): { errorCode: string; message: string; errors: ValidationErrorDetail[] } {
		if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
			const body = exceptionResponse as KnownErrorResponse;
			const message = Array.isArray(body.message) ? 'Validation failed' : (body.message ?? this.defaultMessage(statusCode));

			return {
				errorCode: body.errorCode ?? this.defaultErrorCode(statusCode),
				message,
				errors:
					body.errors ??
					(Array.isArray(body.message)
						? body.message.map((value) => ({
								field: 'request',
								message: value
							}))
						: [])
			};
		}

		return {
			errorCode: this.defaultErrorCode(statusCode),
			message: typeof exceptionResponse === 'string' ? exceptionResponse : this.defaultMessage(statusCode),
			errors: []
		};
	}

	private defaultErrorCode(statusCode: number): ErrorCode {
		const errorCodeByStatus = new Map<number, ErrorCode>([
			[HttpStatus.BAD_REQUEST, ErrorCode.ValidationError],
			[HttpStatus.UNAUTHORIZED, ErrorCode.Unauthorized],
			[HttpStatus.FORBIDDEN, ErrorCode.Forbidden],
			[HttpStatus.NOT_FOUND, ErrorCode.ResourceNotFound],
			[HttpStatus.CONFLICT, ErrorCode.Conflict],
			[HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RateLimited]
		]);

		return errorCodeByStatus.get(statusCode) ?? ErrorCode.InternalServerError;
	}

	private defaultMessage(statusCode: number): string {
		const messageByStatus = new Map<number, string>([
			[HttpStatus.BAD_REQUEST, 'Validation failed'],
			[HttpStatus.UNAUTHORIZED, 'Authentication is required'],
			[HttpStatus.FORBIDDEN, 'Access is forbidden'],
			[HttpStatus.NOT_FOUND, 'Resource was not found'],
			[HttpStatus.CONFLICT, 'Request conflicts with existing state'],
			[HttpStatus.TOO_MANY_REQUESTS, 'Rate limit exceeded']
		]);

		return messageByStatus.get(statusCode) ?? 'Internal server error';
	}
}
