import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export interface ApplicationExceptionResponse {
	errorCode: ErrorCode;
	message: string;
	errors?: Array<{ field: string; message: string }>;
}

export class ApplicationException extends HttpException {
	constructor(errorCode: ErrorCode, message: string, statusCode: HttpStatus, errors?: Array<{ field: string; message: string }>) {
		super({ errorCode, message, errors }, statusCode);
	}
}
