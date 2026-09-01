import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { REQUEST_ID_HEADER } from '../constants/api.constants';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
	use(request: Request, response: Response, next: NextFunction): void {
		const incomingRequestId = request.header(REQUEST_ID_HEADER);
		request.id = incomingRequestId?.trim() || randomUUID();
		response.setHeader(REQUEST_ID_HEADER, request.id);
		next();
	}
}
