import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiFieldErrorDto {
	@ApiProperty({ example: 'email' })
	field!: string;

	@ApiProperty({ example: 'Email must be a valid email address' })
	message!: string;
}

export class ApiErrorResponseDto {
	@ApiProperty({ example: false })
	success!: false;

	@ApiProperty({ example: 400 })
	statusCode!: number;

	@ApiProperty({ example: 'VALIDATION_ERROR' })
	errorCode!: string;

	@ApiProperty({ example: 'Validation failed' })
	message!: string;

	@ApiPropertyOptional({ type: [ApiFieldErrorDto] })
	errors?: ApiFieldErrorDto[];

	@ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
	timestamp!: string;

	@ApiProperty({ example: '/api/v1/auth/register' })
	path!: string;

	@ApiProperty({ example: '9d716e74-8421-4a9a-a80f-489a7be127d8' })
	requestId!: string;
}
